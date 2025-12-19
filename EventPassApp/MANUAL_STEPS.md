d# How to run EventPassApp in Android Studio

Since I cannot launch the Android Studio GUI for you, please follow these steps to run the application on your local machine.

## Prerequisites
- Android Studio is installed.
- User has permissions to access the Android SDK.

## Setup Steps

1.  **Open Project**
    - Open Android Studio.
    - Select "Open".
    - Navigate to the `EventPassApp/android` directory and select it.
    - Wait for Gradle sync to complete.

2.  **Configure SDK (if needed)**
    - If prompted, install any missing SDK platforms or build tools that Android Studio suggests.
    - Ensure your `local.properties` file points to your Android SDK location:
      ```properties
      sdk.dir=/home/codingbear/Android/Sdk
      ```
      *(I have attempted to configure this for you automatically)*

3.  **Run the App**
    - Connect an Android device via USB or start an Android Emulator (AVD Manager).
    - **Crucial Step:** Open a terminal in the `EventPassApp` directory and run:
      ```bash
      npm start
      ```
      This starts the Metro Bundler server which serves the JavaScript bundle to your app.
    - Click the green "Run" (Play) button in the toolbar.
    - Ensure the configuration selected is "app".

    *Note: If you are using a physical device via USB, you may also need to run `adb reverse tcp:8081 tcp:8081` in your terminal.*

## Troubleshooting
- If you see `SDK location not found`, check Step 2.
- If the build fails, try running `Build > Clean Project` and then `Build > Rebuild Project`.
- **"EMFILE: too many open files" Error:**
  ```bash
  echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
  echo fs.inotify.max_user_instances=8192 | sudo tee -a /etc/sysctl.conf
  sudo sysctl -p
  ```
- **Install Watchman (Highly Recommended for Linux):**
  The native Node.js file watcher can be unstable on Linux. Install Watchman to fix this:
  ```bash
  sudo apt-get update
  sudo apt-get install watchman
  ```
  (Note: You might need to build it from source or use Homebrew on Linux if `apt` doesn't have the latest version, but try `apt` first).

- **"Can't find ViewManager" (e.g., RNCAndroidDialogPicker):**
  This happens when you add a new library with native code (like `@react-native-picker/picker`) but haven't rebuilt the Android app.
  **Fix:**
  1. Stop Metro Bundler (`Ctrl+C`).
  2. Rebuild the app: `./gradlew installDebug` (or click "Run" in Android Studio).
  3. Restart Metro: `npm start`.

- **"Toolchain ... does not provide the required capabilities: [JAVA_COMPILER]":**
  Your system has the Java Runtime (JRE) but not the Development Kit (JDK) which contains the compiler (`javac`).
  **Fix:**
  Run the following in your terminal to install the full JDK 17:
  ```bash
  sudo apt-get install -y openjdk-17-jdk
  Thank you for installing the JDK.
  If the CLI build still fails, you can try stopping the daemon: `cd android && ./gradlew --stop` then try again.
  
  **Alternatively, to configure this inside Android Studio (Easier):**
  1. Open the project in Android Studio.
  2. Go to **Settings** (Windows/Linux) or **Preferences** (macOS).
     - On Linux/Windows: `File` > `Settings`.
  3. Navigate to **Build, Execution, Deployment** > **Build Tools** > **Gradle**.
  4. Find the **Gradle JDK** dropdown.
  5. Select **jbr-17** (JetBrains Runtime 17) or any entry that says **version 17**. 
     - If not found, select "Add JDK..." and point it to `/usr/lib/jvm/java-17-openjdk-amd64` or choose "Download JDK" and pick version 17.
  6. Click **Apply** and **OK**.
  7. Sync Gradle and Run the app from Android Studio.
