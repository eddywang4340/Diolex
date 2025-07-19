from kokoro import KPipeline
import soundfile as sf
import sounddevice as sd

pipeline = KPipeline(lang_code='a')

text = '''
Kokoro is an open-weight TTS model with 82 million parameters. Despite its lightweight architecture, it delivers comparable quality to larger models while being significantly faster and more cost-efficient.
'''

generator = pipeline(text, voice='af_heart')

for i, (gs, ps, audio) in enumerate(generator):
    print(i, gs, ps)
    # Play audio instead of Jupyter display
    sd.play(audio, 24000)
    sd.wait()