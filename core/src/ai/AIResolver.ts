import { Query, Resolver, Mutation, Arg, InputType, Field, Subscription, Float, PubSub} from "type-graphql";
import { AITask, AITaskInput } from "./Tasks";
import pako from "pako";
import base64js from 'base64-js';
import { AI_TRANSCRIPTION_TEXT_TOPIC } from "../PubSub";

@Resolver()
export default class AIResolver {
    @Query(returns => [AITask])
    aiTasks(): AITask[] {
        return [new AITask(
            "task1",
            "modelId",
            "task_id",
            "systemPrompt",
            []
        ),
        new AITask(
            "task2",
            "modelId",
            "task_id",
            "systemPrompt",
            []
        )]
    }

    @Mutation(returns => AITask)
    aiAddTask(
        @Arg("task") task: AITaskInput,
    ): AITask {
        return new AITask(
            "task_name",
            task.modelId,
            "task_id",
            task.systemPrompt,
            task.promptExamples
        )
    }

    @Mutation(() => AITask)
    aiRemoveTask(
        @Arg("taskId") taskId: string
    ): AITask {
        return new AITask(
            "task_name",
            "model_id",
            taskId,
            "system prompt",
            []
        )
    }

    @Mutation(() => AITask)
    aiUpdateTask(
        @Arg("taskId") taskId: string,
        @Arg("task") task:AITaskInput,
    ): AITask {
        return new AITask(
            task.name,
            task.modelId,
            taskId,
            task.systemPrompt,
            task.promptExamples
        )
    }

    @Mutation(() => String)
    aiPrompt(
        @Arg("taskId") taskId: string,
        @Arg("prompt") input: string
    ): string {
        return "output"
    }

    @Mutation(() => String)
    aiEmbed(
        @Arg("modelId") modelId: string,
        @Arg("text") text: string
    ): string {
        const vec = [0, 10, 20, 30];
        const vecString = JSON.stringify(vec);
        const compressed = pako.deflate(vecString);
        const compressedString = base64js.fromByteArray(compressed);

        return compressedString;
    }

    @Mutation(() => String)
    aiOpenTranscriptionStream(
        @Arg("modelId") modelId: string
    ): string {
        return "streamId"
    }

    @Mutation(() => String)
    aiCloseTranscriptionStream(
        @Arg("streamId") streamId: string
    ): boolean {
        return true
    }

    @Mutation(() => String)
    aiFeedTranscriptionStream(
        @Arg("streamId") streamId: string,
        @Arg("audio", () => [Float]) audio: number[],
        @PubSub() pubSub: any
    ): boolean {
        pubSub.publish(AI_TRANSCRIPTION_TEXT_TOPIC, { streamId });
        return true
    }

    @Subscription({ topics: AI_TRANSCRIPTION_TEXT_TOPIC, nullable: false })
    aiTranscriptionText(
        @Arg("streamId") streamId: string
    ): string {
        return "transcription"
    }
}