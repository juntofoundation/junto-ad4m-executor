import { Image } from "@mantine/core";
import { useContext, useEffect, useState } from "react";
import { AgentContext } from "../context/AgentContext";
import { Ad4minContext } from "../context/Ad4minContext";
import { useNavigate } from "react-router-dom";

const Login = (props: any) => {
  const {
    state: { loading, hasLoginError },
    methods: { generateAgent, unlockAgent },
  } = useContext(AgentContext);

  const {
    state: { isInitialized, isUnlocked, connected, connectedLaoding },
    methods: { resetEndpoint },
  } = useContext(Ad4minContext);

  let navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSignupIndex, setCurrentSignupIndex] = useState(0);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [opened, setOpened] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  let [passwordError, setPasswordError] = useState<string | null>(null);

  if (hasLoginError) {
    passwordError = "Invalid password";
  }

  const generate = () => {
    checkUsernamePassword();

    if (username.length > 0 && password.length > 0) {
      generateAgent(username, firstName, lastName, password);
    }
  };

  // @ts-ignore
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (isInitialized) {
        unlockAgent(password);
      } else {
        generate();
      }
    }
  };

  const onSignupStepOneKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      gotoNextSignUpStep();
    }
  };

  const onSignupStepTwoKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      generate()
    }
  };

  const checkUsernamePassword = () => {
    if (username.length === 0) {
      setUsernameError("Username is requied");
    } else {
      setUsernameError(null);
    }

    if (password.length === 0) {
      setPasswordError("Password is requied");
    } else {
      setPasswordError(null);
    }
  };

  const gotoNextSignUpStep = () => {
    checkUsernamePassword();

    if (username.length > 0 && password.length > 0) {
      setCurrentSignupIndex(1);
    }
  };

  useEffect(() => {
    if (!connected && !connectedLaoding) {
      navigate("/connect");
    } else if (connected && isUnlocked) {
      navigate("/settings");
    } else if (isInitialized) {
      setCurrentIndex(5);
    }
  }, [connected, isUnlocked, navigate, isInitialized, connectedLaoding]);

  return (
    <div
      className="center"
      style={{
        width: "100%",
        height: "100%",
        paddingLeft: "var(--j-space-400)",
        paddingRight: "var(--j-space-400)",
      }}
    >
      <div className="slider">
        {currentIndex === 0 && (
          <div className="slider__slide">
            <div className="slider__slide-content text-center">
              <j-box pt="500" pb="800">
                <Image
                  style={{ width: "200px", margin: "auto" }}
                  src="ad4msquarelogo2_white_colouremblem.png"
                ></Image>
              </j-box>
              <j-box pt="500">
                <j-text size="800" color="black">
                  P2P Framework Beyond Apps
                </j-text>
              </j-box>
              <j-box py="500">
                <j-flex direction="column" gap="200">
                  <j-button
                    size="xl"
                    onClick={() => setCurrentIndex(1)}
                    variant="primary"
                  >
                    Get Started
                  </j-button>
                  {!isInitialized ? (
                    <j-button
                      size="lg"
                      variant="link"
                      onClick={() => setCurrentIndex(4)}
                    >
                      Sign up
                    </j-button>
                  ) : (
                    <j-button
                      size="lg"
                      variant="link"
                      onClick={() => {
                        setCurrentIndex(5);
                      }}
                    >
                      Sign in
                    </j-button>
                  )}
                </j-flex>
              </j-box>
            </div>
          </div>
        )}
        {currentIndex === 1 && (
          <div className="slider__slide">
            <div className="slider__slide-content text-center">
              <j-box pt="500" pb="800">
                <Image
                  style={{ width: "200px", margin: "auto" }}
                  src="ad4msquarelogo2_white_colouremblem.png"
                ></Image>
              </j-box>
              <j-text variant="heading">Privacy and Security</j-text>
              <j-text variant="ingress">
                AD4M generates keys on your device, so only you have access to
                your account and data. No third parties can snoop on your data
                without your consent.
              </j-text>
              <j-box py="600">
                <j-flex j="center" a="center" gap="500">
                  <j-button
                    variant="link"
                    size="xl"
                    onClick={() => setCurrentIndex(0)}
                  >
                    Previous
                  </j-button>
                  <j-button
                    variant="primary"
                    size="xl"
                    onClick={() => setCurrentIndex(2)}
                  >
                    Next
                  </j-button>
                </j-flex>
              </j-box>
            </div>
          </div>
        )}
        {currentIndex === 2 && (
          <div className="slider__slide">
            <div className="slider__slide-content text-center">
              <j-box pt="500" pb="800">
                <Image
                  style={{ width: "200px", margin: "auto" }}
                  src="ad4msquarelogo2_white_colouremblem.png"
                ></Image>
              </j-box>
              <j-text variant="heading">Agent centric</j-text>
              <j-text variant="ingress">
                With AD4M you own your data and decide what apps get to use it.
                No more app silos with you as the central authority. Censorship
                free.
              </j-text>
              <j-box py="600">
                <j-flex j="center" a="center" gap="500">
                  <j-button
                    variant="link"
                    size="xl"
                    onClick={() => setCurrentIndex(1)}
                  >
                    Previous
                  </j-button>
                  <j-button
                    variant="primary"
                    size="xl"
                    onClick={() => setCurrentIndex(3)}
                  >
                    Next
                  </j-button>
                </j-flex>
              </j-box>
            </div>
          </div>
        )}
        {currentIndex === 3 && (
          <div className="slider__slide">
            <div className="slider__slide-content text-center">
              <j-box pt="500" pb="800">
                <Image
                  style={{ width: "200px", margin: "auto" }}
                  src="ad4msquarelogo2_white_colouremblem.png"
                ></Image>
              </j-box>
              <j-text variant="heading">Censorship free</j-text>
              <j-text variant="ingress">
                AD4M allows you to express yourself without fear of censorship
                or suppression. You can share your thoughts and opinions without
                worrying about being silenced by a central authority.
              </j-text>
              <j-box py="600">
                <j-flex j="center" a="center" gap="500">
                  <j-button
                    variant="link"
                    size="xl"
                    onClick={() => setCurrentIndex(2)}
                  >
                    Previous
                  </j-button>
                  {!isInitialized ? (
                    <j-button
                      size="xl"
                      variant="primary"
                      onClick={() => setCurrentIndex(4)}
                    >
                      Sign up
                    </j-button>
                  ) : (
                    <j-button
                      size="xl"
                      variant="primary"
                      onClick={() => {
                        setCurrentIndex(5);
                      }}
                    >
                      Sign in
                    </j-button>
                  )}
                </j-flex>
              </j-box>
            </div>
          </div>
        )}
        {currentIndex === 4 && (
          <div className="slider__slide">
            <div className="slider__slide-content slider__slide-content--small">
              <Image
                style={{ width: "140px", margin: "auto" }}
                src="ad4msquarelogo2_white_colouremblem.png"
              ></Image>
              <j-box p="500"></j-box>
              {currentSignupIndex === 0 && (
                <>
                  <j-input
                    full
                    autofocus
                    size="lg"
                    label="Username"
                    minlength={10}
                    maxlength={30}
                    autovalidate
                    required
                    type="text"
                    onInput={(e: any) => setUsername(e.target.value)}
                  ></j-input>
                  <j-box p="200"></j-box>
                  <j-input
                    autofocus
                    size="lg"
                    label="Password"
                    minlength={10}
                    maxlength={30}
                    autovalidate
                    required
                    type={showPassword ? "text" :"password"}
                    full
                    onInput={(e: any) => setPassword(e.target.value)}
                    onKeyDown={onSignupStepOneKeyDown}
                  >
                    <j-button onClick={() => setShowPassword(!showPassword)} slot="end" variant="link" square>
                      <j-icon name={showPassword ? 'eye-slash' : 'eye'} size="sm" ></j-icon>
                    </j-button>
                  </j-input>
                  <j-box p="200"></j-box>
                  <j-button
                    full
                    size="lg"
                    variant="primary"
                    style={{ alignSelf: "center" }}
                    onClick={() => gotoNextSignUpStep()}
                    loading={loading}
                  >
                    Next
                  </j-button>
                </>
              )}
              {currentSignupIndex === 1 && (
                <>
                  <j-input
                    full
                    autofocus
                    size="lg"
                    label="First name (optional)"
                    minlength={10}
                    maxlength={30}
                    autovalidate
                    type="text"
                    onKeyDown={onSignupStepTwoKeyDown}
                    onInput={(e: any) => setFirstName(e.target.value)}
                  ></j-input>
                  <j-box p="200"></j-box>
                  <j-input
                    full
                    size="lg"
                    label="Last name (optional)"
                    minlength={10}
                    maxlength={30}
                    autovalidate
                    type="text"
                    onKeyDown={onSignupStepTwoKeyDown}
                    onInput={(e: any) => setLastName(e.target.value)}
                  ></j-input>
                  <j-box p="200"></j-box>
                  <j-button
                    full
                    size="lg"
                    variant="primary"
                    style={{ alignSelf: "center" }}
                    onClick={() => generate()}
                    loading={loading}
                  >
                    Generate Agent
                  </j-button>
                </>
              )}
            </div>
          </div>
        )}
        {currentIndex === 5 && (
          <div className="slider__slide">
            <div className="slider__slide-content slider__slide-content--small">
              <Image
                style={{ width: "140px", margin: "auto" }}
                src="ad4msquarelogo2_white_colouremblem.png"
              ></Image>
              <j-box p="500"></j-box>
              <j-input
                autofocus
                size="lg"
                label="Password"
                minlength={10}
                maxlength={30}
                autovalidate
                required
                type={showPassword ? "text" :"password"}
                full
                onInput={(e: any) => setPassword(e.target.value)}
                onKeyDown={onKeyDown}
              >
                <j-button onClick={() => setShowPassword(!showPassword)} slot="end" variant="link" square>
                  <j-icon name={showPassword ? 'eye-slash' : 'eye'} size="sm" ></j-icon>
                </j-button>
              </j-input>
              <j-box p="200"></j-box>
              <j-button
                full
                size="lg"
                variant="primary"
                style={{ alignSelf: "center" }}
                onClick={() => unlockAgent(password)}
                loading={loading}
              >
                Unlock Agent
              </j-button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
