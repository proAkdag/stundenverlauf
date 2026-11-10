// Stundenverlauf · logic/planlink.mjs — der Plan einer Stunde als Link-Teil „#plan=…“ und zurück.
/* Weitergeben (2.2, Zero „Beides“): gepackt im Teil hinter „#“, den der Browser nie an einen Server schickt; derselbe Text
   steckt im QR-Code. Nur Plandaten, keine Namen.
   2.3 (Zero: „Smartphone ist damit die Zentrale“): pid und Phasen-IDs reisen mit. Kommt der Plan mit derselben pid
   zurück, aktualisiert er genau diese Stunde — auch während sie auf der Bühne läuft. „offen“ und „gelaufen“ bleiben
   Sache des Geräts, auf dem die Stunde lief. Ohne DOM: braucht nur CompressionStream, Blob und Response. */
import { pruefePlan } from './plan.mjs?v=3.0.0';

export const b64url = {
  an: u8 => btoa(String.fromCharCode(...u8)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  ab: s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
};
const strom = async (bytes, umform) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(umform)).arrayBuffer());

/* '#plan=…' — die Ansicht setzt Adresse der App davor */
export async function planHash(p) {
  // „ausfall“ (logic/tage.mjs) gehört wie „gelaufen“ dem Gerät: der Link bleibt, wie die 2.3.4 ihn kennt
  const { gelaufen, ausfall, ...rest } = structuredClone(p);
  rest.phasen = rest.phasen.map(({ offen, ...x }) => x);
  const gepackt = await strom(new TextEncoder().encode(JSON.stringify(rest)), new CompressionStream('deflate-raw'));
  return '#plan=' + b64url.an(gepackt);
}
/* Plan aus '#plan=…' oder null; wirft bei kaputten Daten (der Aufrufer fängt) */
export async function planAusLink(hash) {
  const m = /^#plan=([A-Za-z0-9_-]{1,12000})$/.exec(hash);   // Grenze: ein QR-Code trägt ohnehin weniger
  if (!m) return null;
  const roh = await strom(b64url.ab(m[1]), new DecompressionStream('deflate-raw'));
  if (roh.length > 65536) return null;
  const o = JSON.parse(new TextDecoder().decode(roh));
  if (!o || typeof o !== 'object' || Array.isArray(o) || !Array.isArray(o.phasen)) return null;
  // fremde Daten: nur was die Prüfung durchlässt (IDs nur a–z0–9, eindeutig, nie ein festes Fenster);
  // „offen“ und „gelaufen“ gehören dem Gerät, auf dem die Stunde lief
  const p = pruefePlan(o);
  p.phasen.forEach(x => { x.offen = false; });
  p.gelaufen = '';
  return p;
}
/* Ein gescannter Text enthält vielleicht irgendwo einen Plan-Link */
export const planTeilIn = txt => /#plan=[A-Za-z0-9_-]+/.exec(txt)?.[0] || null;
