import type { LearningLevel } from '../learning/types';

export type CallCenterTopic = 'Help Desk' | 'Windows' | 'Linux' | 'Redes' | 'AWS' | 'Ciberseguridad' | 'Cloud computing' | 'Bases de datos' | 'Servicios TIC';
export type CorrectionTiming = 'immediate' | 'turn' | 'session';
export type HelpLanguage = 'English' | 'Español';
export interface AgentCorrection { original: string; corrected: string; explanationEs: string }

const correctionRules: Array<{ pattern: RegExp; replacement: string; explanationEs: string }> = [
  { pattern: /\bmy computer no work\b/i, replacement: "my computer isn't working", explanationEs: 'Para describir un problema que ocurre ahora, usa be + verbo en -ing: “isn’t working”.' },
  { pattern: /\b(can(?:not|'t) connect) (?:to )?internet\b/i, replacement: "$1 to the internet", explanationEs: 'En este contexto se dice “connect to the internet”; internet suele llevar el artículo the.' },
  { pattern: /\b(i am not connect(?:ed)?)\b/i, replacement: "I can't connect", explanationEs: 'Para expresar que no puedes establecer una conexión, usa “can’t + verbo base”: “can’t connect”.' },
  { pattern: /\b(the network|the system|the application) don't work\b/i, replacement: "$1 doesn't work", explanationEs: 'Con un sujeto singular de tercera persona se usa “doesn’t” y el verbo base “work”.' },
  { pattern: /\b(i have a error)\b/i, replacement: 'I have an error', explanationEs: 'Usa “an” antes del sonido vocálico inicial de “error”.' },
  { pattern: /\b(i am agree)\b/i, replacement: 'I agree', explanationEs: '“Agree” es un verbo; no se combina con “am”.' },
];

export function correctTechnicalEnglish(input: string): AgentCorrection | null {
  const original = input.trim();
  let corrected = original;
  const explanations: string[] = [];
  for (const rule of correctionRules) {
    if (rule.pattern.test(corrected)) {
      const next = corrected.replace(rule.pattern, rule.replacement);
      if (next.toLowerCase() !== corrected.toLowerCase()) {
        corrected = next;
        explanations.push(rule.explanationEs);
      }
    }
  }
  if (!explanations.length) return null;
  const sentence = corrected.charAt(0).toUpperCase() + corrected.slice(1).replace(/([.!?])?$/, ending => ending || '.');
  return { original, corrected: sentence, explanationEs: explanations.join(' ') };
}

type AgentContext = { topic: CallCenterTopic; level: LearningLevel; history: string[]; message: string };
function isAny(text: string, terms: string[]) { return terms.some(term => text.includes(term)); }

/** A transparent, rule-based practice demo: it uses the topic and conversation history, never calls itself AI. */
export function generateLocalAgentReply({ topic, level, history, message }: AgentContext): string {
  const text = message.toLowerCase();
  const allUserContext = `${history.join(' ')} ${text}`.toLowerCase();
  const simple = level === 'A1' || level === 'A2';
  const earlierSteps = history.length > 0;
  const technicalIssue = isAny(text, ['wifi', 'wi-fi', 'network', 'internet', 'dns', 'vpn', 'connection', 'connect']);
  const performanceIssue = isAny(text, ['slow', 'freeze', 'frozen', 'crash', 'application', 'app', 'error']);
  const accessIssue = isAny(text, ['login', 'log in', 'password', 'account', 'sign in', 'mfa', 'code']);
  const securityIssue = isAny(text, ['suspicious', 'phishing', 'security', 'attack', 'unknown sign', 'mfa', 'stolen']);
  const cloudIssue = isAny(text, ['cloud', 'aws', 'service', 'outage', 'region', 'database', 'server', 'sla']);
  const triedSomething = isAny(text, ['restarted', 'rebooted', 'reconnected', 'tried', 'already', 'still', 'again', 'now works', 'fixed']);
  const urgency = isAny(text, ['everyone', 'all users', 'urgent', 'critical', 'outage', 'production', 'cannot work']);
  const reportsResolved = isAny(text, ['it works now', 'works now', 'working again', 'fixed it', 'it is fixed', 'issue is resolved']);
  let reply: string;

  if (securityIssue || (accessIssue && isAny(text, ['share', 'sent', 'code', 'unknown']))) {
    reply = simple
      ? 'Thank you for telling me. Do not share a password or security code. Did you start that sign-in?'
      : 'Thank you for reporting it. Do not disclose a password or verification code. Did you initiate the sign-in, and has anyone else reported the alert?';
  } else if (reportsResolved && history.length) {
    reply = simple
      ? `Good to hear the ${topic} issue is better. Can you check it one more time and tell me if it still works?`
      : `Good to hear the ${topic} service is responding again. Could you verify the original workflow and confirm whether any users or errors remain affected?`;
  } else if (technicalIssue) {
    if (triedSomething && earlierSteps) reply = simple
      ? 'Thanks for trying that. What changed after you reconnected: do other websites open, or only the company page fail?'
      : 'Thanks for testing that step. Based on what you have described, is name resolution still failing, or has the symptom changed? Please share the exact error, not any credentials.';
    else if (isAny(allUserContext, ['vpn'])) reply = simple
      ? 'I understand the VPN is involved. Does it say connected, and can another approved company service open?'
      : `You mentioned the ${topic} connection. Is the VPN tunnel established, and can you reach another approved internal service? That will help separate DNS from routing.`;
    else reply = simple
      ? 'I understand the connection problem. Does the Wi-Fi icon show connected, and can another device use the same network?'
      : `Let’s narrow down the ${topic} issue. Are other users or devices affected, and does the failure occur before or after VPN connection?`;
  } else if (performanceIssue) {
    reply = triedSomething && earlierSteps
      ? 'Thanks for checking. Is the computer responsive now, and did the application show a new error after the restart?'
      : simple
        ? 'I understand the computer is slow. When did it start, and is the whole computer slow or only one application?'
        : `Let’s establish the scope of the ${topic} issue. When did the slowdown begin, what changed beforehand, and is the impact limited to one application?`;
  } else if (accessIssue) {
    reply = 'I can help you check the sign-in safely. Please do not send your password or one-time code. What exact message appears, and did you initiate the request?';
  } else if (cloudIssue || urgency) {
    reply = simple
      ? 'I understand this may affect a service. Who is affected, and when did the problem start?'
      : `Let’s assess the ${topic} impact before choosing a mitigation. Which service and users are affected, when did it begin, and is there a safe approved workaround?`;
  } else if (isAny(text, ['hint', 'help me say', 'how do i say', 'how can i say'])) {
    reply = `You can say: “The issue started at [time], and it affects [users or service].” Now, what ${topic} symptom can you confirm?`;
  } else if (isAny(text, ['hello', 'hi ', 'good morning', 'good afternoon'])) {
    reply = `Hello, and welcome to the ${topic} practice. What technical issue would you like to report?`;
  } else {
    const previousProblem = history.find(item => isAny(item.toLowerCase(), ['network', 'computer', 'application', 'account', 'cloud', 'server', 'error']));
    reply = previousProblem
      ? `Thanks. I’ll keep the earlier ${topic} context in mind. Could you add one specific detail: when it started, who is affected, or what error you can see?`
      : `Thanks for explaining that. For this ${topic} practice, what happened first, what have you already checked, and what result do you see now?`;
  }
  if (level === 'C1') reply += ' Please distinguish confirmed facts from assumptions.';
  return reply;
}

export function getLocalHint(topic: CallCenterTopic, level: LearningLevel, helpLanguage: HelpLanguage = 'English'): string {
  if (helpLanguage === 'Español') {
    if (level === 'A1' || level === 'A2') return `Puedes intentar: “I have a problem with ${topic.toLowerCase()}.” Después, describe lo que ves.`;
    return 'Prueba con una actualización breve: “The issue began at [time], affects [scope], and we have confirmed [evidence].”';
  }
  if (level === 'A1' || level === 'A2') return `Try: “I have a problem with ${topic.toLowerCase()}.” Then describe what you can see.`;
  return `Try a concise incident update: “The issue began at [time], affects [scope], and we have confirmed [evidence].”`;
}

export const callCenterTopics: CallCenterTopic[] = ['Help Desk', 'Windows', 'Linux', 'Redes', 'AWS', 'Ciberseguridad', 'Cloud computing', 'Bases de datos', 'Servicios TIC'];
