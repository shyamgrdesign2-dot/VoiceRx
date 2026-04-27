import { VoiceAssistantFab } from '../components/voice-assistant-fab';

export default function Page() {
  return (
    <main
      style={{
        minHeight: '100vh',
        margin: 0,
        display: 'grid',
        placeItems: 'center',
        background:
          'radial-gradient(circle at top, #f7ecff 0%, #f7f5fb 32%, #ffffff 72%)',
        padding: 16,
      }}
    >
      <VoiceAssistantFab />
    </main>
  );
}
