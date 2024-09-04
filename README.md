The project has been created using the following technologies:

**1. React.js**: This is likely being used as the framework for building the user interface and
managing the application's state, including the rendering of the 3D avatar.
**2. Three.js:** This library is being used to render 3D graphics in the browser, which would include
the digital avatar and its animations.
**3. Azure Cognitive Services Speech SDK:** This service is used for converting text to speech
and generating viseme data (facial expressions) that synchronize the avatar's facial animations
with the speech.

Together, these technologies are integrated to create a dynamic and interactive application
where a digital avatar can speak and show corresponding facial expressions in real-time.
We need to run two components simultaneously to make the avatar talk: the frontend, which
loads the avatar, and the backend, which handles the avatar's speech.


**Frontend**

The main file that does the work in the frontend is App.js -
This code sets up a React web application that renders a 3D avatar using `@react-three/fiber`
and `@react-three/drei` libraries. It allows users to select a language (English or Hindi) from a
dropdown menu, and the avatar will speak the corresponding text.

Key functionalities include:

**1. 3D Avatar Rendering:** The avatar model is loaded and rendered using Three.js, with
textures and animations applied to various parts like the body, eyes, hair, etc.
**2. Text-to-Speech Integration:** Based on the selected language, the app generates speech
using an API and synchronizes the avatar's mouth and facial movements with the speech.
**3. Audio Playback:** The app uses `ReactAudioPlayer` to play the generated speech audio,
synchronizing it with the avatar's animations.
**4. UI Elements:** A dropdown menu for language selection and a button to trigger speech are
provided. The UI is styled for a clean and modern look.

The app combines 3D graphics, animations, and audio to create an interactive, speaking avatar
experience.

Code for the backend - https://github.com/Coderandme/News_Reporter_Bot_Backend

**Backend**

The main file that does the work in the frontend is tts.js -

The script in this file is designed for converting text into speech using Microsoft's Azure
Cognitive Services Speech SDK. The script supports speech synthesis in various voices and
formats the output as an MP3 file. Additionally, it tracks viseme data, capturing facial
expressions for avatar animation based on speech.

Key functionalities include:
**Text-to-Speech Conversion:** The script accepts text and a specified voice to generate speech,
which is then saved as an MP3 file.
**Viseme Tracking:** It captures viseme data (facial expressions) as blend shapes for each time
step, enabling synchronized facial animations with speech.
**SSML Support:** The script uses Speech Synthesis Markup Language (SSML) to structure and
customize speech synthesis requests.
**Promise-based Implementation:** The conversion process is handled asynchronously, returning
a promise with the blend shape data and the file path to the generated audio.

In addition to tts.js we also have index.js files that take care of the routing.

**NOTE** - We need keys from Azure Speech service and use it in the .env file for AZURE_KEY
and AZURE_REGION to convert text to speech
