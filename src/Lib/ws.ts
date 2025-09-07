export type GateMessage =
| { type: 'zone-update'; payload: any }
| { type: 'admin-update'; payload: any }
| { type: 'pong' }
| { type: string; payload?: any };


export function connectGateWS(baseUrl: string, gateId: string) {
// مثال: لو الـ API على http://localhost:3000
// والسيرفر بيستخدم ws على نفس الأصل: ws://localhost:3000/ws
const wsUrl = baseUrl.replace(/^http/, 'ws') + '/ws';
const ws = new WebSocket(wsUrl);


ws.addEventListener('open', () => {
ws.send(
JSON.stringify({ type: 'subscribe', payload: { gateId } })
);
});


function on<T extends GateMessage['type']>(type: T, handler: (msg: any) => void) {
const listener = (ev: MessageEvent) => {
try {
const data = JSON.parse(ev.data) as GateMessage;
if (data.type === type) handler(data.payload ?? data);
} catch (e) {}
};
ws.addEventListener('message', listener);
return () => ws.removeEventListener('message', listener);
}


return { ws, on }
}