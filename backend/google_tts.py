from gtts import gTTS
import os

def text_to_speech(text):
    # Convert text to speech in Hindi
    speech = gTTS(text, lang='en', slow=False, tld='com')

    # Save the audio file
    speech_file = 'speech.mp3'
    speech.save(speech_file)

    # Play the audio file
    os.system('afplay ' + speech_file)  # Use 'start' for Windows or 'mpg321' for Linux

# text_to_speech("ಸುನೀತಾ ಶಾಂತ, ಮಧ್ಯಮ ಧ್ವನಿಯಲ್ಲಿ ನಿಧಾನವಾಗಿ ಮಾತನಾಡುತ್ತಾರೆ, ತಟಸ್ಥ ಧ್ವನಿಯಲ್ಲಿ ಸುದ್ದಿಯನ್ನು ತಲುಪಿಸುತ್ತಾರೆ. ಯಾವುದೇ ಹಿನ್ನೆಲೆ ಶಬ್ದವಿಲ್ಲದೆ ರೆಕಾರ್ಡಿಂಗ್ ಉತ್ತಮ ಗುಣಮಟ್ಟದ್ದಾಗಿದೆ.")
text='''
The sky above the port was the color of television, tuned to a dead channel.
"It's not like I'm using," Case heard someone say, as he shouldered his way through the crowd around the door of the Chat. "It's like my body's developed this massive drug deficiency."
It was a Sprawl voice and a Sprawl joke. The Chatsubo was a bar for professional expatriates; you could drink there for a week and never hear two words in Japanese.


[Kokoro](/kˈOkəɹO/) is an open-weight TTS model with 82 million parameters. Despite its lightweight architecture, it delivers comparable quality to larger models while being significantly faster and more cost-efficient. With Apache-licensed weights, [Kokoro](/kˈOkəɹO/) can be deployed anywhere from production environments to personal projects.
'''
text_to_speech(text)
