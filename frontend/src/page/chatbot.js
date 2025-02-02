import { useState, useRef, useEffect } from "react"
import { BotIcon as Robot, Mic, Send, Volume2, VolumeX, Camera, RotateCw, Menu, X } from "lucide-react"
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition"
import axios from "axios"
import "../style/chatbot.css"

export default function Chatbot() {
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    height: "",
    weight: "",
  })

  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([{ text: "Hi! I'm Robo, your AI health assistant.", isBot: true }])
  const [isListening, setIsListening] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isProfileSubmitted, setIsProfileSubmitted] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [isCameraFront, setIsCameraFront] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const audioRef = useRef(null)
  const videoRef = useRef(null)
  const photoRef = useRef(null)
  const fileInputRef = useRef(null)
  const currentAudioURL = useRef(null)

  const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition()

  useEffect(() => {
    setMessage(transcript)
  }, [transcript])

  useEffect(() => {
    return () => {
      if (currentAudioURL.current) {
        URL.revokeObjectURL(currentAudioURL.current)
      }
    }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true)
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await axios.post("http://localhost:8000/user-context/", formData)
      console.log("Profile saved:", response.data)
      setIsProfileSubmitted(true)
    } catch (error) {
      console.error("Error saving profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const queryBackend = async (question) => {
    try {
      const textResponse = await axios.post("http://localhost:8000/query/", {
        question: question,
      })

      const audioResponse = await axios.post(
        "http://localhost:8000/query-with-tts/",
        {
          question: question,
        },
        {
          responseType: "blob",
        },
      )

      return {
        text: textResponse.data,
        audio: audioResponse.data,
      }
    } catch (error) {
      console.error("Error querying backend:", error)
      throw error
    }
  }

  const handleMessageSubmit = async (e) => {
    e.preventDefault()
    if (message.trim()) {
      setMessages((prev) => [...prev, { text: message, isBot: false }])
      const userMessage = message
      setMessage("")
      resetTranscript()
      setIsLoading(true)

      try {
        setMessages((prev) => [...prev, { text: "Thinking...", isBot: true, isLoading: true }])

        const response = await queryBackend(userMessage)

        if (currentAudioURL.current) {
          URL.revokeObjectURL(currentAudioURL.current)
        }

        const audioURL = URL.createObjectURL(response.audio)
        currentAudioURL.current = audioURL

        setMessages((prev) => {
          const withoutLoading = prev.filter((msg) => !msg.isLoading)
          return [
            ...withoutLoading,
            {
              text: response.text.answer || response.text.toString(),
              isBot: true,
              audioURL: audioURL,
            },
          ]
        })

        if (audioRef.current) {
          audioRef.current.src = audioURL
          audioRef.current.play()
          setIsSpeaking(true)
        }
      } catch (error) {
        setMessages((prev) => {
          const withoutLoading = prev.filter((msg) => !msg.isLoading)
          return [...withoutLoading, { text: "Sorry, I encountered an error. Please try again.", isBot: true }]
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleMicClick = () => {
    if (!browserSupportsSpeechRecognition) {
      alert("Your browser doesn't support speech recognition.")
      return
    }

    if (isListening) {
      SpeechRecognition.stopListening()
    } else {
      resetTranscript()
      SpeechRecognition.startListening({ continuous: true })
    }
    setIsListening(!isListening)
  }

  const toggleAudio = (audioURL) => {
    if (audioRef.current) {
      if (audioRef.current.src === audioURL && !audioRef.current.paused) {
        audioRef.current.pause()
        setIsSpeaking(false)
      } else {
        audioRef.current.src = audioURL
        audioRef.current.play()
        setIsSpeaking(true)
      }
    }
  }

  const handleCameraClick = () => {
    fileInputRef.current.click()
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setMessages((prev) => [...prev, { image: e.target.result, isBot: false }])
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCapture = () => {
    const video = videoRef.current
    const photo = photoRef.current
    const ctx = photo.getContext("2d")

    photo.width = video.videoWidth
    photo.height = video.videoHeight

    ctx.drawImage(video, 0, 0, photo.width, photo.height)

    photo.toBlob((blob) => {
      const img = new Image()
      img.src = URL.createObjectURL(blob)
      setMessages((prev) => [...prev, { image: img.src, isBot: false }])
    })

    setShowCameraModal(false)
    video.srcObject.getTracks().forEach((track) => track.stop())
  }

  const handleFlipCamera = () => {
    setIsCameraFront(!isCameraFront)
    const video = videoRef.current
    video.srcObject.getTracks().forEach((track) => track.stop())
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: isCameraFront ? "environment" : "user" } })
      .then((stream) => {
        video.srcObject = stream
        video.play()
      })
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="chatbot-container">
      <header className="app-header">
        <div className="header-content">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
          <h1 className="app-title">RoboCare</h1>
        </div>
      </header>

      <audio ref={audioRef} onEnded={() => setIsSpeaking(false)} onError={() => setIsSpeaking(false)} />

      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="logo">
          <Robot className="h-6 w-6" />
          <span>RoboCare</span>
        </div>

        {!isProfileSubmitted ? (
          <form onSubmit={handleFormSubmit} className="form">
            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                type="number"
                id="age"
                name="age"
                placeholder="Years"
                value={formData.age}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select id="gender" name="gender" value={formData.gender} onChange={handleInputChange}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="height">Height</label>
              <input
                type="text"
                id="height"
                name="height"
                placeholder="cm"
                value={formData.height}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="weight">Weight</label>
              <input
                type="text"
                id="weight"
                name="weight"
                placeholder="kg"
                value={formData.weight}
                onChange={handleInputChange}
              />
            </div>
            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Profile"}
            </button>
          </form>
        ) : (
          <p className="success-message">Profile submitted! You can now chat.</p>
        )}
      </div>

      <div className="chat-area">
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.isBot ? "bot-message" : "user-message"} ${msg.isLoading ? "loading" : ""}`}
            >
              {msg.isBot && <Robot className="bot-icon" />}
              <div className="message-bubble">
                {msg.text}
                {msg.image && <img src={msg.image || "/placeholder.svg"} alt="Uploaded" className="uploaded-image" />}
                {msg.audioURL && (
                  <button onClick={() => toggleAudio(msg.audioURL)} className="audio-toggle-button">
                    {isSpeaking && audioRef.current?.src === msg.audioURL ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="input-area">
          <form onSubmit={handleMessageSubmit} className="message-form">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How are you feeling right now?..."
              className="message-input"
              disabled={!isProfileSubmitted || isLoading}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={handleCameraClick}
              className="camera-button"
              disabled={!isProfileSubmitted || isLoading}
            >
              <Camera className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleMicClick}
              className={`mic-button ${isListening ? "recording" : ""}`}
              style={{
                color: isListening ? "#22c55e" : "currentColor",
                backgroundColor: isListening ? "rgba(34, 197, 94, 0.1)" : "transparent",
              }}
              disabled={!isProfileSubmitted || isLoading}
            >
              <Mic className="h-5 w-5" />
            </button>
            <button type="submit" className="send-button" disabled={!isProfileSubmitted || isLoading}>
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>

      {showCameraModal && (
        <div className="camera-modal">
          <div className="camera-content">
            <video ref={videoRef} className="camera-preview" />
            <canvas ref={photoRef} style={{ display: "none" }} />
            <div className="camera-controls">
              <button onClick={handleCapture} className="capture-button">
                Capture
              </button>
              <button onClick={handleFlipCamera} className="flip-button">
                <RotateCw className="h-5 w-5" />
              </button>
              <button onClick={() => setShowCameraModal(false)} className="close-button">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

