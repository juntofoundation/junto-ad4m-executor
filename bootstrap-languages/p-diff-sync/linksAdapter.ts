import { LinkSyncAdapter, PerspectiveDiffObserver, HolochainLanguageDelegate, LanguageContext, PerspectiveDiff, 
  LinkExpression, DID, Perspective, PerspectiveState } from "https://esm.sh/@perspect3vism/ad4m@0.5.0";
import type { SyncStateChangeObserver } from "https://esm.sh/@perspect3vism/ad4m@0.5.0";
import { Mutex, withTimeout } from "https://esm.sh/async-mutex@0.4.0";
import { DNA_NICK, ZOME_NAME } from "./build/dna.js";
import { encodeBase64 } from "https://deno.land/std@0.220.1/encoding/base64.ts";

class PeerInfo {
  //@ts-ignore
  currentRevision: Uint8Array;
  //@ts-ignore
  lastSeen: Date;
};

export class LinkAdapter implements LinkSyncAdapter {
  hcDna: HolochainLanguageDelegate;
  linkCallback?: PerspectiveDiffObserver
  syncStateChangeCallback?: SyncStateChangeObserver
  peers: Map<DID, PeerInfo> = new Map();
  generalMutex: Mutex = withTimeout(new Mutex(), 10000, new Error('PerspectiveDiffSync: generalMutex timeout'));
  me: DID
  gossipLogCount: number = 0;
  myCurrentRevision: Uint8Array | null = null;

  constructor(context: LanguageContext) {
    //@ts-ignore
    this.hcDna = context.Holochain as HolochainLanguageDelegate;
    this.me = context.agent.did;
  }

  writable(): boolean {
    return true;
  }

  public(): boolean {
    return false;
  }

  async others(): Promise<DID[]> {
    //@ts-ignore
    let others = await this.hcDna.call(DNA_NICK, ZOME_NAME, "get_others", null);
    console.log("PerspectiveDiffSync.others(); others", others);
    return others as DID[];
  }

  async currentRevision(): Promise<string> {
    //@ts-ignore
    let res = await this.hcDna.call(DNA_NICK, ZOME_NAME, "current_revision", null);
    console.log("PerspectiveDiffSync.currentRevision(); res", res);
    return res as string;
  }

  async sync(): Promise<PerspectiveDiff> {
    //console.log("PerspectiveDiffSync.sync(); Getting lock");
    const release = await this.generalMutex.acquire();
    //console.log("PerspectiveDiffSync.sync(); Got lock");
    try {
      //@ts-ignore
      let current_revision = await this.hcDna.call(DNA_NICK, ZOME_NAME, "sync", null);
      if (current_revision && current_revision instanceof Uint8Array) {
        this.myCurrentRevision = current_revision; 
      }
    } catch (e) {
      console.error("PerspectiveDiffSync.sync(); got error", e);
    } finally {
      release();
    }
    await this.gossip();
    return new PerspectiveDiff()
  }

  async gossip() {
    this.gossipLogCount += 1;
    let lostPeers: DID[] = [];

    const release = await this.generalMutex.acquire();
    try {
      this.peers.forEach( (peerInfo, peer) => {
        if (peerInfo.lastSeen.getTime() + 10000 < new Date().getTime()) {
          lostPeers.push(peer);
        }
      });

      for (const peer of lostPeers) {
        this.peers.delete(peer);
      }

      // flatten the map into an array of peers
      let peers = Array.from(this.peers.keys());
      peers.push(this.me);
      
      // Lexically sort the peers
      peers = peers.sort();

      // If we are the first peer, we are the scribe
      let is_scribe = (peers[0] == this.me);
      
      // Get a deduped set of all peer's current revisions
      let revisions = new Set<Uint8Array>();
      for(const peerInfo of this.peers.values()) {
        if (peerInfo.currentRevision) revisions.add(peerInfo.currentRevision);
      }

      //Do checking on incoming gossip revisions and see if we have the same hash as the majority of the peers
      //Get a copied array of revisions that are the same as mine
      let sameRevisions;
      //Get a copied array of revisions that are different than mine
      let differentRevisions;

      function generateRevisionStates(myCurrentRevision: Uint8Array) {
        sameRevisions = revisions.size == 0 ? [] : Array.from(revisions).filter( (revision) => {
          return myCurrentRevision && (encodeBase64(revision) == encodeBase64(myCurrentRevision));
        });
        if (myCurrentRevision) {
          sameRevisions.push(myCurrentRevision);
        };
        differentRevisions = revisions.size == 0 ? [] : Array.from(revisions).filter( (revision) => {
          return myCurrentRevision && !(encodeBase64(revision) == encodeBase64(myCurrentRevision));
        });
      }

      async function checkSyncState(callback: SyncStateChangeObserver) {
        if (sameRevisions.length > 0 || differentRevisions.length > 0) {
          if (sameRevisions.length <= differentRevisions.length) {
            await callback(PerspectiveState.LinkLanguageInstalledButNotSynced);
          } else {
            await callback(PerspectiveState.Synced);
          };
        }
      }

      //@ts-ignore
      generateRevisionStates(this.myCurrentRevision);

      //@ts-ignore
      await checkSyncState(this.syncStateChangeCallback);

      for (const hash of Array.from(revisions)) {
        if(!hash) continue
        if (this.myCurrentRevision && (encodeBase64(hash) == encodeBase64(this.myCurrentRevision))) continue;
        
        let pullResult = await this.hcDna.call(DNA_NICK, ZOME_NAME, "pull", { 
          hash,
          is_scribe 
        });

        if (pullResult) {
          if (pullResult.current_revision && Buffer.isBuffer(pullResult.current_revision)) {
            let myRevision = pullResult.current_revision;
            this.myCurrentRevision = myRevision;

            //@ts-ignore
            generateRevisionStates(this.myCurrentRevision);
            //@ts-ignore
            await checkSyncState(this.syncStateChangeCallback);
          }
        }
      }

      //Only show the gossip log every 10th iteration
      if (this.gossipLogCount == 10) {
        let others = await this.others();
        console.log(`
        ======
        GOSSIP
        --
        me: ${this.me}
        is scribe: ${is_scribe}
        --
        others: ${others.join(', ')}
        --
        ${Array.from(this.peers.entries()).map( ([peer, peerInfo]) => {
          //@ts-ignore
          return `${peer}: ${encodeBase64(peerInfo.currentRevision)} ${peerInfo.lastSeen.toISOString()}\n`
        })}
        --
        revisions: ${Array.from(revisions).map( (hash) => {
          //@ts-ignore
          return encodeBase64(hash)
        })}
        `);
        this.gossipLogCount = 0;
      }
    } catch (e) {
      console.error("PerspectiveDiffSync.gossip(); got error", e);
    } finally {
      release();
    }
  }

  async render(): Promise<Perspective> {
    //@ts-ignore
    let res = await this.hcDna.call(DNA_NICK, ZOME_NAME, "render", null);
    return new Perspective(res.links);
  }

  async commit(diff: PerspectiveDiff): Promise<string> {
    //console.log("PerspectiveDiffSync.commit(); Getting lock");
    const release = await this.generalMutex.acquire();
    try {
      //console.log("PerspectiveDiffSync.commit(); Got lock");
      let prep_diff = {
        additions: diff.additions.map((diff) => prepareLinkExpression(diff)),
        removals: diff.removals.map((diff) => prepareLinkExpression(diff))
      }

      let attempts = 0;
      const maxAttempts = 5;
      let lastError;

      while (attempts < maxAttempts) {
        try {
          let res = await this.hcDna.call(DNA_NICK, ZOME_NAME, "commit", prep_diff);
          if (res && Buffer.isBuffer(res)) {
            this.myCurrentRevision = res;
          }
          return res as string;
        } catch (e) {
          lastError = e;
          attempts++;
          if (attempts < maxAttempts) {
            console.warn(`PerspectiveDiffSync.commit(); attempt ${attempts} failed, retrying...`, e);
            // Wait a small amount before retrying
            await new Promise(resolve => setTimeout(resolve, 100 * attempts));
          }
        }
      }
      
      console.error(`PerspectiveDiffSync.commit(); failed after ${maxAttempts} attempts`, lastError);
    } finally {
      release();
    }
  }

  addCallback(callback: PerspectiveDiffObserver): number {
    this.linkCallback = callback;
    return 1;
  }

  addSyncStateChangeCallback(callback: SyncStateChangeObserver): number {
    this.syncStateChangeCallback = callback;
    return 1;
  }

  async handleHolochainSignal(signal: any): Promise<void> {
    const { diff, reference_hash, reference, broadcast_author } = signal.payload;
    //Check if this signal came from another agent & contains a diff and reference_hash
    if (diff && reference_hash && reference && broadcast_author) {
      // console.log(`PerspectiveDiffSync.handleHolochainSignal: 
      //       diff: ${JSON.stringify(diff)}
      //       reference_hash: ${reference_hash.toString('base64')}
      //       reference: {
      //           diff: ${reference.diff?.toString('base64')}
      //           parents: ${reference.parents ? reference.parents.map( (parent: Buffer) => parent ? parent.toString('base64') : 'null').join(', '):'none'}
      //           diffs_since_snapshot: ${reference?.diffs_since_snapshot}
      //       }
      //       broadcast_author: ${broadcast_author}
      //       `)
      try {
        //console.log("PerspectiveDiffSync.handleHolochainSignal: Getting lock");

        //console.log("PerspectiveDiffSync.handleHolochainSignal: Got lock");
        this.peers.set(broadcast_author, { currentRevision: reference_hash, lastSeen: new Date() });
      } catch (e) {
        console.error("PerspectiveDiffSync.handleHolochainSignal: got error", e);
      }
    } else {
      //console.log("PerspectiveDiffSync.handleHolochainSignal: received a signals from ourselves in fast_forward_signal or in a pull: ", signal.payload);
      //This signal only contains link data and no reference, and therefore came from us in a pull in fast_forward_signal
      if (this.linkCallback) {
        await this.linkCallback(signal.payload);
      }
    }
  }

  async addActiveAgentLink(hcDna: HolochainLanguageDelegate): Promise<any> {
    if (hcDna == undefined) {
      console.warn("===Perspective-diff-sync: Error tried to add an active agent link but received no hcDna to add the link onto");
    } else {
      return await hcDna.call(
        DNA_NICK,
        ZOME_NAME,
        "add_active_agent_link",
        //@ts-ignore
        null
      );
    }
  }
}

function prepareLinkExpression(link: LinkExpression): object {
  const data = Object.assign(link);
  if (data.data.source == "") {
    data.data.source = null;
  }
  if (data.data.target == "") {
    data.data.target = null;
  }
  if (data.data.predicate == "") {
    data.data.predicate = null;
  }
  if (data.data.source == undefined) {
    data.data.source = null;
  }
  if (data.data.target == undefined) {
    data.data.target = null;
  }
  if (data.data.predicate == undefined) {
    data.data.predicate = null;
  }
  return data;
}
