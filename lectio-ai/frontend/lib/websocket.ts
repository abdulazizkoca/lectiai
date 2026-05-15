export class LectioWebSocket {
  private ws: WebSocket | null = null;
  private roomId: string;
  private onMessage: (data: Record<string, unknown>) => void;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;

  constructor(roomId: string, onMessage: (data: Record<string, unknown>) => void) {
    this.roomId = roomId;
    this.onMessage = onMessage;
  }

  connect() {
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
    this.ws = new WebSocket(`${wsUrl}/api/polling/ws/${this.roomId}`);

    this.ws.onopen = () => {};

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.onMessage(data);
    };

    this.ws.onclose = () => {
      if (this.shouldReconnect) {
        this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
      }
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket xatolik:", err);
    };
  }

  sendPoll(question: string, options: string[]) {
    this.send({ type: "create_poll", question, options });
  }

  vote(option: string) {
    this.send({ type: "vote", option });
  }

  endPoll() {
    this.send({ type: "end_poll" });
  }

  private send(data: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.ws?.close();
  }
}
