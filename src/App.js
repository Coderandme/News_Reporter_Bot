import React, { Suspense, useEffect, useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useTexture, Loader, Environment, useFBX, useAnimations, OrthographicCamera } from '@react-three/drei';
import { MeshStandardMaterial } from 'three/src/materials/MeshStandardMaterial';

import { LinearEncoding, sRGBEncoding } from 'three/src/constants';
import { LineBasicMaterial, MeshPhysicalMaterial, Vector2 } from 'three';
import ReactAudioPlayer from 'react-audio-player';

import createAnimation from './converter';
import blinkData from './blendDataBlink.json';

import * as THREE from 'three';
import axios from 'axios';
const _ = require('lodash');

const host = 'http://localhost:5000' 

function Avatar({ avatar_url, speak, setSpeak, text, language ,setAudioSource, playing }) {

  let gltf = useGLTF(avatar_url);
  let morphTargetDictionaryBody = null;
  let morphTargetDictionaryLowerTeeth = null;

  const [ 
    bodyTexture, 
    eyesTexture, 
    teethTexture, 
    bodySpecularTexture, 
    bodyRoughnessTexture, 
    bodyNormalTexture,
    teethNormalTexture,
    // teethSpecularTexture,
    hairTexture,
    tshirtDiffuseTexture,
    tshirtNormalTexture,
    tshirtRoughnessTexture,
    hairAlphaTexture,
    hairNormalTexture,
    hairRoughnessTexture,
    ] = useTexture([
    "/images/body.webp",
    "/images/eyes.webp",
    "/images/teeth_diffuse.webp",
    "/images/body_specular.webp",
    "/images/body_roughness.webp",
    "/images/body_normal.webp",
    "/images/teeth_normal.webp",
    // "/images/teeth_specular.webp",
    "/images/h_color.webp",
    "/images/tshirt_diffuse.webp",
    "/images/tshirt_normal.webp",
    "/images/tshirt_roughness.webp",
    "/images/h_alpha.webp",
    "/images/h_normal.webp",
    "/images/h_roughness.webp",
  ]);

  _.each([
    bodyTexture, 
    eyesTexture, 
    teethTexture, 
    teethNormalTexture, 
    bodySpecularTexture, 
    bodyRoughnessTexture, 
    bodyNormalTexture, 
    tshirtDiffuseTexture, 
    tshirtNormalTexture, 
    tshirtRoughnessTexture,
    hairAlphaTexture,
    hairNormalTexture,
    hairRoughnessTexture
  ], t => {
    t.encoding = sRGBEncoding;
    t.flipY = false;
  });

  bodyNormalTexture.encoding = LinearEncoding;
  tshirtNormalTexture.encoding = LinearEncoding;
  teethNormalTexture.encoding = LinearEncoding;
  hairNormalTexture.encoding = LinearEncoding;


  
  gltf.scene.traverse(node => {


    if(node.type === 'Mesh' || node.type === 'LineSegments' || node.type === 'SkinnedMesh') {
  
      node.castShadow = true;
      node.receiveShadow = true;
      node.frustumCulled = false;

    
      if (node.name.includes("Body")) {

        node.castShadow = true;
        node.receiveShadow = true;

        node.material = new MeshPhysicalMaterial();
        node.material.map = bodyTexture;
        // node.material.shininess = 60;
        node.material.roughness = 1.7;

        // node.material.specularMap = bodySpecularTexture;
        node.material.roughnessMap = bodyRoughnessTexture;
        node.material.normalMap = bodyNormalTexture;
        node.material.normalScale = new Vector2(0.6, 0.6);

        morphTargetDictionaryBody = node.morphTargetDictionary;

        node.material.envMapIntensity = 0.8;
        // node.material.visible = false;

      }

      if (node.name.includes("Eyes")) {
        
        node.material = new MeshStandardMaterial();
        node.material.map = eyesTexture;
        // node.material.shininess = 100;
        node.material.roughness = 0.1;
        node.material.envMapIntensity = 0.5;
      }


      if (node.name.includes("Brows")) {
        node.material = new LineBasicMaterial({color: 0x8B4513});
        node.material.linewidth = 1;
        node.material.opacity = 0.5;
        node.material.transparent = true;
        node.visible = true;
      }

      if (node.name.includes("Teeth")) {

        node.receiveShadow = true;
        node.castShadow = true;
        node.material = new MeshStandardMaterial();
        node.material.roughness = 0.1;
        node.material.map = teethTexture;
        node.material.normalMap = teethNormalTexture;

        node.material.envMapIntensity = 0.7;


      }

      if (node.name.includes("Hair")) {
       
        node.material = new MeshStandardMaterial();
        node.material.map = hairTexture;
        node.material.alphaMap = hairAlphaTexture;
        node.material.normalMap = hairNormalTexture;
        node.material.roughnessMap = hairRoughnessTexture;
        
        node.material.transparent = true;
        node.material.depthWrite = false;
        node.material.side = 2;
        node.material.color.setHex(0x000000);
        
        node.material.envMapIntensity = 0.3;

      
      }

      if (node.name.includes("TSHIRT")) {
        node.material = new MeshStandardMaterial();

        node.material.map = tshirtDiffuseTexture;
        node.material.roughnessMap = tshirtRoughnessTexture;
        node.material.normalMap = tshirtNormalTexture;
        node.material.color.setHex(0xffffff);

        node.material.envMapIntensity = 0.5;


      }

      if (node.name.includes("TeethLower")) {
        morphTargetDictionaryLowerTeeth = node.morphTargetDictionary;
      }

    }

  });

  const [clips, setClips] = useState([]);
  const mixer = useMemo(() => new THREE.AnimationMixer(gltf.scene), [gltf.scene]); 

  useEffect(() => {

    if (speak === false)
      return;

    makeSpeech(text, language)
    .then( response => { 

      let {blendData, filename}= response.data;

      let newClips = [ 
        createAnimation(blendData, morphTargetDictionaryBody, 'HG_Body'), 
        createAnimation(blendData, morphTargetDictionaryLowerTeeth, 'HG_TeethLower') ];

      filename = host + filename;
        
      setClips(newClips);
      setAudioSource(filename);

    })
    .catch(err => {
      console.error(err);
      setSpeak(false);

    })

  }, [speak, morphTargetDictionaryBody, morphTargetDictionaryLowerTeeth, setAudioSource, setSpeak, text]);

  let idleFbx = useFBX('/idle.fbx');
  let { clips: idleClips } = useAnimations(idleFbx.animations);

  idleClips[0].tracks = _.filter(idleClips[0].tracks, track => {
    return track.name.includes("Head") || track.name.includes("Neck") || track.name.includes("Spine2");
  });

  idleClips[0].tracks = _.map(idleClips[0].tracks, track => {

    if (track.name.includes("Head")) {
      track.name = "head.quaternion";
    }

    if (track.name.includes("Neck")) {
      track.name = "neck.quaternion";
    }

    if (track.name.includes("Spine")) {
      track.name = "spine2.quaternion";
    }

    return track;

  });

  useEffect(() => {

    let idleClipAction = mixer.clipAction(idleClips[0]);
    idleClipAction.play();

    let blinkClip = createAnimation(blinkData, morphTargetDictionaryBody, 'HG_Body');
    let blinkAction = mixer.clipAction(blinkClip);
    blinkAction.play();


  }, [idleClips, mixer, morphTargetDictionaryBody]);

  // Play animation clips when available
  useEffect(() => {

    if (playing === false)
      return;
    
    _.each(clips, clip => {
        let clipAction = mixer.clipAction(clip);
        clipAction.setLoop(THREE.LoopOnce);
        clipAction.play();

    });

  }, [playing, clips , mixer]);

  
  useFrame((state, delta) => {
    mixer.update(delta);
  });


  return (
    <group name="avatar">
      <primitive object={gltf.scene} dispose={null} />
    </group>
  );
}


function makeSpeech(text, language) {
  const voice = language === 'English' ? 'en-US-JennyNeural' : 'hi-IN-SwaraNeural';
  return axios.post(host + '/talk', { text, voice });
}

const STYLES = {
  dropdown: {
    marginRight: '10px', // Space between dropdown and button
    padding: '10px',     // Increased padding for a better look
    fontSize: '16px',    // Font size for readability
    color: '#333333',    // Darker color for better contrast
    border: '1px solid #ccc', // Light border for a cleaner look
    borderRadius: '4px', // Rounded corners
    backgroundColor: '#ffffff', // White background for the dropdown
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)' // Subtle shadow for a lifted effect
  },
  buttonContainer: {
    display: 'flex',     // Use flexbox to align items horizontally
    alignItems: 'center' // Align items vertically in the center
  },
  speak: {
    padding: '10px 20px', // More padding for a better button size
    marginTop: '0',       // Remove marginTop to align properly with the dropdown
    display: 'inline-block', // Make button inline to sit next to dropdown
    color: '#FFFFFF',     // Text color
    background: '#007BFF', // Bootstrap primary color for a modern look
    border: 'none',       // No border
    borderRadius: '4px',  // Rounded corners
    cursor: 'pointer',    // Pointer cursor on hover
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)', // Shadow for depth
    transition: 'background-color 0.3s ease', // Smooth background color transition
    fontSize: '16px'      // Font size for readability
  },
  speakHover: {
    background: '#0056b3' // Darker shade on hover for the button
  },
  area: {
    position: 'absolute', 
    bottom: '10px', 
    left: '10px', 
    zIndex: 500
  },
  area2: {
    position: 'absolute', 
    top: '5px', 
    right: '15px', 
    zIndex: 500
  },
  label: {
    color: '#777777', 
    fontSize: '0.8em'
  }
}


function App() {

  const audioPlayer = useRef();
  const [text, setText] = useState("Hello! I'm here to deliver today's news. Please choose your preferred language");
  const [language, setLanguage] = useState('');
  const [speak, setSpeak] = useState(false);
  const [audioSource, setAudioSource] = useState(null);
  const [playing, setPlaying] = useState(false);

  const handleLanguageChange = (event) => {
    const selectedLanguage = event.target.value;
    setLanguage(selectedLanguage);
    const updatedText = selectedLanguage === 'English'
      ? "Today's news is as follows, Global efforts to combat climate change are gaining momentum as countries around the world pledge to reduce carbon emissions. The United Nations has called for urgent action to limit global warming to 1.5 degrees Celsius above pre-industrial levels, and governments are responding with ambitious plans. In the technology sector, major advancements in artificial intelligence are continuing to shape the future of industries. From healthcare to finance, AI is transforming how businesses operate, offering new opportunities for efficiency and innovation. Meanwhile, in the world of sports, the upcoming Olympic Games are set to captivate audiences worldwide. Athletes are preparing to compete on the global stage, showcasing their skills and determination. The event promises to be a thrilling spectacle, with new records expected to be set. Finally, in entertainment, a highly anticipated movie release is breaking box office records. The film, which features groundbreaking visual effects and a star-studded cast, has garnered rave reviews from critics and audiences alike."
      : "आज की समाचार इस प्रकार हैं, जलवायु परिवर्तन से निपटने के लिए वैश्विक प्रयास तेजी से बढ़ रहे हैं, क्योंकि दुनिया भर के देश कार्बन उत्सर्जन को कम करने का संकल्प ले रहे हैं। संयुक्त राष्ट्र ने औद्योगिक क्रांति से पहले के स्तरों की तुलना में वैश्विक तापमान वृद्धि को 1.5 डिग्री सेल्सियस तक सीमित करने के लिए त्वरित कार्रवाई की अपील की है, और सरकारें इस दिशा में महत्वाकांक्षी योजनाएं बना रही हैं। तकनीकी क्षेत्र में, कृत्रिम बुद्धिमत्ता (AI) के क्षेत्र में महत्वपूर्ण प्रगति हो रही है, जो विभिन्न उद्योगों के भविष्य को आकार दे रही है। स्वास्थ्य सेवा से लेकर वित्त तक, AI व्यवसायों के संचालन के तरीके को बदल रहा है, जिससे नए अवसर और नवाचार की संभावनाएं सामने आ रही हैं। खेल जगत में, आगामी ओलंपिक खेलों का आयोजन दर्शकों के लिए बेहद रोमांचक होने वाला है। खिलाड़ी वैश्विक मंच पर प्रतिस्पर्धा के लिए तैयार हैं, अपनी क्षमताओं और दृढ़ संकल्प को प्रदर्शित करते हुए। यह आयोजन एक रोमांचक नज़ारा होगा, जिसमें नए रिकॉर्ड बनने की उम्मीद है। अंत में, मनोरंजन की दुनिया में, एक बहुप्रतीक्षित फिल्म ने बॉक्स ऑफिस पर रिकॉर्ड तोड़ दिया है। इस फिल्म में अत्याधुनिक विशेष प्रभाव और एक सितारों से सजी कास्ट है, जिसने समीक्षकों और दर्शकों दोनों से प्रशंसा प्राप्त की है।";

    setText(updatedText);
  };

  // End of play
  function playerEnded(e) {
    setAudioSource(null);
    setSpeak(false);
    setPlaying(false);
  }

  // Player is read
  function playerReady(e) {
    audioPlayer.current.audioEl.current.play();
    setPlaying(true);

  }  

  return (
    <div className="full">
      <div style={STYLES.area}>
        <select value={language} onChange={handleLanguageChange} style={STYLES.dropdown}>
        <option value="" disabled>Select Language</option>
        <option value="English">English</option>
        <option value="Hindi">Hindi</option>
      </select>

        <button onClick={() => setSpeak(true)} style={STYLES.speak}> { speak? 'Running...': 'Speak' }</button>

      </div>

      <ReactAudioPlayer
        src={audioSource}
        ref={audioPlayer}
        onEnded={playerEnded}
        onCanPlayThrough={playerReady}
        
      />
      
      {/* <Stats /> */}
    <Canvas dpr={2} onCreated={(ctx) => {
        ctx.gl.physicallyCorrectLights = true;
      }}>

      <OrthographicCamera 
      makeDefault
      zoom={2000}
      position={[0, 1.65, 1]}
      />

      {/* <OrbitControls
        target={[0, 1.65, 0]}
      /> */}

      <Suspense fallback={null}>
        <Environment background={false} files="/images/photo_studio_loft_hall_1k.hdr" />
      </Suspense>

      <Suspense fallback={null}>
        <Bg />
      </Suspense>

      <Suspense fallback={null}>



          <Avatar 
            avatar_url="/model.glb" 
            speak={speak} 
            setSpeak={setSpeak}
            text={text}
            language={language}
            setAudioSource={setAudioSource}
            playing={playing}
            />

      
      </Suspense>

  

  </Canvas>
  <Loader dataInterpolation={(p) => `Loading... please wait`}  />
  </div>
  )
}

function Bg() {
  
  const texture = useTexture('/images/background.png');

  return(
    <mesh position={[0, 1.5, -2]} scale={[0.8, 0.8, 0.8]}>
       <planeGeometry />
      <meshBasicMaterial map={texture} />

    </mesh>
  )

}

export default App;
