import type { LearningLevel, ChoiceExercise } from '../learning/types';

export interface CallCenterTurn { speaker: 'agent' | 'user'; english: string; spanish: string }
export interface CallCenterScenario {
  id: LearningLevel;
  title: string;
  description: string;
  objectives: string[];
  vocabulary: Array<{ term: string; meaning: string }>;
  grammar: { name: string; explanation: string; examples: string[]; exercises: ChoiceExercise[] };
  transcript: CallCenterTurn[];
  listeningQuestions: ChoiceExercise[];
  speakingPrompts: string[];
  speakingModel: string;
  usefulExpressions: string[];
  situation: string;
}

const q = (id: string, prompt: string, options: string[], answerIndex: number, explanationEs: string): ChoiceExercise => ({ id, prompt, options, answerIndex, explanationEs });

export const callCenterScenarios: CallCenterScenario[] = [
  {
    id: 'A1', title: 'Atención básica de soporte técnico',
    description: 'Ayuda a una persona que no puede iniciar sesión en su computadora.',
    situation: 'La persona usuaria no puede entrar en su cuenta. Confirma el problema, guía una comprobación sencilla y verifica el resultado.',
    objectives: ['Saludar y presentarse con cortesía.', 'Preguntar qué sucede e identificar cuenta y pantalla.', 'Dar instrucciones breves y confirmar la solución.'],
    vocabulary: [{term:'computer',meaning:'computadora'}, {term:'password',meaning:'contraseña'}, {term:'username',meaning:'nombre de usuario'}, {term:'account',meaning:'cuenta'}, {term:'screen',meaning:'pantalla'}, {term:'restart',meaning:'reiniciar'}, {term:'help',meaning:'ayuda'}, {term:'problem',meaning:'problema'}],
    grammar: { name: 'To be, preguntas e imperativos', explanation: 'Usa am/is/are para identificar personas y estados. En preguntas básicas, coloca “is/are” antes del sujeto o usa “do” con el presente simple. Para dar instrucciones, empieza con el verbo base.', examples: ['I am Alex from IT support. — Soy Alex, de soporte de TI.', 'Is the screen showing an error? — ¿La pantalla muestra un error?', 'Please restart the computer. — Reinicia la computadora, por favor.'], exercises: [
      q('a1-g1','Complete: I ___ from technical support.',['am','is','are'],0,'Con I se usa am.'),
      q('a1-g2','Choose the correct question.',['Do the screen is on?','Is the screen on?','Are the screen on?'],1,'Screen es singular; en una pregunta con to be se usa Is + sujeto.'),
      q('a1-g3','Choose the polite instruction.',['Please restart the computer.','Please restarts the computer.','Please to restart the computer.'],0,'El imperativo usa el verbo base, sin -s ni to.')
    ]},
    transcript: [
      {speaker:'agent',english:'Good morning. IT support, this is Alex. How can I help you?',spanish:'Buenos días. Soporte de TI, habla Alex. ¿En qué puedo ayudarle?'},
      {speaker:'user',english:'Hello. I cannot log in to my computer.',spanish:'Hola. No puedo iniciar sesión en mi computadora.'},
      {speaker:'agent',english:'I can help with that. What is your username? Please do not tell me your password.',spanish:'Puedo ayudarle. ¿Cuál es su nombre de usuario? No me diga su contraseña, por favor.'},
      {speaker:'user',english:'My username is ana.garcia. The screen says “incorrect password.”',spanish:'Mi nombre de usuario es ana.garcia. La pantalla dice “contraseña incorrecta”.'},
      {speaker:'agent',english:'Thank you. Is Caps Lock on? The light is usually on when the key is active.',spanish:'Gracias. ¿Está activada la tecla Bloq Mayús? Normalmente, la luz se enciende cuando está activa.'},
      {speaker:'user',english:'Yes, the light is on. I did not see it.',spanish:'Sí, la luz está encendida. No la había visto.'},
      {speaker:'agent',english:'Please turn Caps Lock off, check your username, and enter your password privately.',spanish:'Desactive Bloq Mayús, compruebe su nombre de usuario e introduzca su contraseña de forma privada.'},
      {speaker:'user',english:'I turned it off. I am trying again now.',spanish:'La desactivé. Lo estoy intentando de nuevo.'},
      {speaker:'agent',english:'Take your time. Does the account open now?',spanish:'Tómese su tiempo. ¿Ya se abre la cuenta?'},
      {speaker:'user',english:'Yes, I can see my desktop now.',spanish:'Sí, ya puedo ver mi escritorio.'},
      {speaker:'agent',english:'Great. Please save your work. If the problem returns, use the password reset link; never share your password with support.',spanish:'Muy bien. Guarde su trabajo. Si vuelve el problema, use el enlace para restablecer la contraseña; nunca comparta su contraseña con soporte.'},
      {speaker:'user',english:'I understand. Thank you for your help.',spanish:'Entiendo. Gracias por su ayuda.'},
      {speaker:'agent',english:'You are welcome. Is there anything else I can help you with today?',spanish:'Con gusto. ¿Puedo ayudarle con algo más hoy?'},
      {speaker:'user',english:'No, that is all. Goodbye.',spanish:'No, eso es todo. Adiós.'},
      {speaker:'agent',english:'Thank you for calling. Have a good day. Goodbye.',spanish:'Gracias por llamar. Que tenga buen día. Adiós.'}
    ],
    listeningQuestions: [
      q('a1-l1','What message does the user see?',['Incorrect password.','No network.','Disk full.'],0,'La persona menciona el mensaje “incorrect password”.'),
      q('a1-l2','What does the agent ask the user to check?',['The printer cable.','Caps Lock and the username.','The Wi-Fi password.'],1,'El agente pide revisar Bloq Mayús y el nombre de usuario.'),
      q('a1-l3','What security advice does the agent give?',['Share the password by phone.','Write the password in the ticket.','Never share the password with support.'],2,'El agente recuerda que nunca debe compartirse la contraseña.')
    ],
    speakingPrompts: ['Greet the caller and introduce yourself.', 'Ask what message appears on the screen without requesting a password.', 'Give two polite troubleshooting instructions.', 'Confirm whether the user can see the desktop and close the call.'],
    speakingModel: 'Good morning, IT support. My name is Alex. How can I help you? What message do you see on the screen? Please check that Caps Lock is off and try again. Do not share your password with me. Can you see your desktop now?',
    usefulExpressions: ['How can I help you? — ¿En qué puedo ayudarle?', 'What message do you see? — ¿Qué mensaje aparece?', 'Please do not share your password. — No comparta su contraseña, por favor.', 'Does the account open now? — ¿Ya se abre la cuenta?', 'Thank you for calling. — Gracias por llamar.']
  },
  {
    id: 'A2', title: 'Solución de problemas informáticos',
    description: 'Diagnostica una computadora lenta con aplicaciones que se bloquean.',
    situation: 'Una persona informa que su equipo está lento y una aplicación se bloqueó después de una actualización.',
    objectives: ['Preguntar cuándo comenzó y qué cambió.', 'Describir síntomas en presente y pasado.', 'Dar instrucciones paso a paso y verificar el mensaje de error.'],
    vocabulary: [{term:'application',meaning:'aplicación'}, {term:'software',meaning:'programa o software'}, {term:'update',meaning:'actualización'}, {term:'error message',meaning:'mensaje de error'}, {term:'restart',meaning:'reiniciar'}, {term:'slow computer',meaning:'computadora lenta'}, {term:'freeze',meaning:'bloquearse'}, {term:'task manager',meaning:'administrador de tareas'}],
    grammar: { name: 'Presente y pasado simple, can/can’t e imperativos', explanation: 'Usa presente simple para síntomas actuales y pasado simple para cuándo empezó el problema. “Can/can’t” expresa posibilidad o capacidad; las instrucciones usan el verbo base.', examples: ['The application freezes every morning. — La aplicación se bloquea cada mañana.', 'It started after the update. — Empezó después de la actualización.', 'Can you open Task Manager? — ¿Puedes abrir el Administrador de tareas?'], exercises: [
      q('a2-g1','Complete: The problem ___ yesterday.',['start','started','starting'],1,'Yesterday señala pasado simple: started.'),
      q('a2-g2','Choose the correct question.',['When did it start?','When it did started?','When does it started?'],0,'La pregunta en pasado usa did + sujeto + verbo base.'),
      q('a2-g3','Complete: You ___ close the frozen application with Task Manager.',['can','cans','are can'],0,'Can va seguido del verbo base y no cambia según el sujeto.')
    ]},
    transcript: [
      {speaker:'agent',english:'IT service desk, this is Jordan. Could you describe what is happening?',spanish:'Mesa de servicio de TI, habla Jordan. ¿Podría describir qué sucede?'},
      {speaker:'user',english:'My computer is very slow, and the design application keeps freezing.',spanish:'Mi computadora está muy lenta y la aplicación de diseño se sigue bloqueando.'},
      {speaker:'agent',english:'When did you first notice the problem? Did anything change before it started?',spanish:'¿Cuándo notó el problema por primera vez? ¿Cambió algo antes de que empezara?'},
      {speaker:'user',english:'It started yesterday after a software update. The error message says the application is not responding.',spanish:'Empezó ayer después de una actualización de software. El mensaje de error dice que la aplicación no responde.'},
      {speaker:'agent',english:'Thanks. Is the whole computer frozen, or only that application?',spanish:'Gracias. ¿Se bloqueó toda la computadora o solo esa aplicación?'},
      {speaker:'user',english:'Only the application. I can still move the mouse and open other windows.',spanish:'Solo la aplicación. Todavía puedo mover el mouse y abrir otras ventanas.'},
      {speaker:'agent',english:'That helps. Please save any work in the other windows. Then press Control, Alt, and Delete, and open Task Manager.',spanish:'Eso ayuda. Guarde el trabajo de las otras ventanas. Después pulse Control, Alt y Suprimir y abra el Administrador de tareas.'},
      {speaker:'user',english:'Task Manager is open. The application is using a lot of memory.',spanish:'El Administrador de tareas está abierto. La aplicación está usando mucha memoria.'},
      {speaker:'agent',english:'I see. Select only the unresponsive application and choose End task. Unsaved work in that application may be lost.',spanish:'Entiendo. Seleccione solo la aplicación que no responde y elija Finalizar tarea. Podría perderse el trabajo no guardado en esa aplicación.'},
      {speaker:'user',english:'I saved a copy earlier. I ended the task, and the computer is responding again.',spanish:'Guardé una copia antes. Finalicé la tarea y la computadora vuelve a responder.'},
      {speaker:'agent',english:'Good. Please restart the computer when convenient, then check whether the application has another update. Do not install anything from an unknown website.',spanish:'Bien. Reinicie la computadora cuando pueda y compruebe si hay otra actualización de la aplicación. No instale nada de sitios desconocidos.'},
      {speaker:'user',english:'I restarted it. The application opened normally this time.',spanish:'La reinicié. Esta vez la aplicación se abrió normalmente.'},
      {speaker:'agent',english:'Excellent. I will record the update and the recovery steps in the service ticket. Please contact us if it freezes again.',spanish:'Excelente. Registraré en el ticket la actualización y los pasos para recuperar el servicio. Contáctenos si vuelve a bloquearse.'},
      {speaker:'user',english:'I will. Thank you for explaining each step.',spanish:'Lo haré. Gracias por explicar cada paso.'},
      {speaker:'agent',english:'You are welcome. Is there anything else you would like us to check?',spanish:'Con gusto. ¿Hay algo más que quiera que revisemos?'},
      {speaker:'user',english:'No, that fixed it. Goodbye.',spanish:'No, eso lo solucionó. Adiós.'}
    ],
    listeningQuestions: [
      q('a2-l1','When did the issue begin?',['After a software update yesterday.','After replacing the monitor.','Last month after a network change.'],0,'El usuario dice que empezó ayer después de una actualización.'),
      q('a2-l2','What was frozen?',['The whole computer.','Only the design application.','The mouse and keyboard.'],1,'El mouse y otras ventanas seguían funcionando.'),
      q('a2-l3','What did the user do before ending the task?',['Saved a copy earlier.','Uninstalled the operating system.','Shared an administrator password.'],0,'La persona había guardado una copia antes.')
    ],
    speakingPrompts: ['Ask when the slow performance started and what changed.', 'Clarify whether the whole computer or one application is affected.', 'Explain a safe step in Task Manager and warn about unsaved work.', 'Summarize the resolution and next action.'],
    speakingModel: 'The computer has been slow since yesterday, after a software update. Only the design application is freezing; the rest of the system still works. Please save your work before ending the unresponsive task. After restarting, check for an update from the official application. I will record the result in the service ticket.',
    usefulExpressions: ['When did you first notice the problem? — ¿Cuándo notó el problema por primera vez?', 'Is the whole computer frozen? — ¿Se bloqueó toda la computadora?', 'Please save your work first. — Guarde su trabajo primero, por favor.', 'The application is not responding. — La aplicación no responde.', 'I will record this in the service ticket. — Lo registraré en el ticket de servicio.']
  },
  {
    id: 'B1', title: 'Soporte de redes y conectividad',
    description: 'Investiga por qué una empleada no puede conectarse a la red institucional.',
    situation: 'La conexión falla en una oficina; hay que distinguir entre Wi-Fi, DNS y VPN y escalar con datos útiles.',
    objectives: ['Recopilar síntomas, alcance y momento de inicio.', 'Explicar causas probables sin presentarlas como certezas.', 'Probar pasos seguros y escalar la incidencia con claridad.'],
    vocabulary: [{term:'connectivity',meaning:'conectividad'}, {term:'wireless network',meaning:'red inalámbrica'}, {term:'IP address',meaning:'dirección IP'}, {term:'DNS',meaning:'sistema de nombres de dominio'}, {term:'VPN',meaning:'red privada virtual'}, {term:'router',meaning:'enrutador'}, {term:'outage',meaning:'interrupción del servicio'}, {term:'escalate',meaning:'escalar o transferir la incidencia'}],
    grammar: { name: 'Pasado simple, presente perfecto, modales y condicionales', explanation: 'Usa pasado simple con un momento definido y presente perfecto para una situación que llega hasta ahora. “Might/could” comunica posibilidades; el condicional básico describe el resultado esperado de una prueba.', examples: ['The connection stopped at 9 a.m. — La conexión dejó de funcionar a las 9.', 'Have you restarted the router? — ¿Ha reiniciado el enrutador?', 'If DNS is the issue, the IP connection may still work. — Si el problema es DNS, la conexión por IP podría funcionar.'], exercises: [
      q('b1-g1','Choose the correct form: The VPN ___ working at 9 a.m.',['has stopped','stopped','stops'],1,'At 9 a.m. señala un momento pasado terminado: stopped.'),
      q('b1-g2','Complete: ___ you checked whether other employees are affected?',['Did','Have','Do'],1,'Present perfect pregunta por una comprobación reciente relevante ahora.'),
      q('b1-g3','Complete: If the DNS server is unavailable, the names ___ resolve.',['might not','must not to','are not'],0,'Might not expresa una posibilidad, no una certeza.')
    ]},
    transcript: [
      {speaker:'agent',english:'Network operations, this is Priya. What connection issue are you experiencing?',spanish:'Operaciones de red, habla Priya. ¿Qué problema de conexión tiene?'},
      {speaker:'user',english:'I cannot reach the company portal from the third-floor office. The Wi-Fi icon says connected, but pages do not load.',spanish:'No puedo acceder al portal corporativo desde la oficina del tercer piso. El icono de Wi-Fi dice conectado, pero las páginas no cargan.'},
      {speaker:'agent',english:'When did it start, and are other people in that area affected?',spanish:'¿Cuándo empezó y hay otras personas afectadas en esa zona?'},
      {speaker:'user',english:'It started around nine this morning. Two colleagues reported the same issue, but the guest network works.',spanish:'Empezó alrededor de las nueve de esta mañana. Dos colegas informaron lo mismo, pero la red de invitados funciona.'},
      {speaker:'agent',english:'Thank you. Have you connected to the corporate VPN, or does the problem happen before the VPN starts?',spanish:'Gracias. ¿Se conectó a la VPN corporativa o el problema aparece antes de que se inicie la VPN?'},
      {speaker:'user',english:'The VPN client connects, but it cannot resolve the company portal name.',spanish:'El cliente de VPN se conecta, pero no puede resolver el nombre del portal corporativo.'},
      {speaker:'agent',english:'That may point to DNS, although we should verify it. Please note the exact error and check whether your device has a valid IP address.',spanish:'Eso podría indicar un problema de DNS, aunque debemos verificarlo. Anote el error exacto y compruebe si su dispositivo tiene una dirección IP válida.'},
      {speaker:'user',english:'The address starts with 10.24. The error says the DNS server is not responding.',spanish:'La dirección empieza con 10.24. El error dice que el servidor DNS no responde.'},
      {speaker:'agent',english:'The address appears to be on our internal range. Please disconnect and reconnect the VPN once. Do not change network settings or use a public DNS server.',spanish:'La dirección parece pertenecer a nuestro rango interno. Desconecte y vuelva a conectar la VPN una vez. No cambie la configuración de red ni use un DNS público.'},
      {speaker:'user',english:'I reconnected the VPN. The portal still does not load, but the error is now different.',spanish:'Volví a conectar la VPN. El portal aún no carga, pero ahora el error es distinto.'},
      {speaker:'agent',english:'Understood. I will escalate this as a possible DNS service incident. Could you send the error text and the time it occurred through the approved ticket system?',spanish:'Entendido. Lo escalaré como posible incidente del servicio DNS. ¿Puede enviar el texto del error y la hora por el sistema de tickets autorizado?'},
      {speaker:'user',english:'Yes. I have included the affected floor and the two other users in the ticket.',spanish:'Sí. Incluí en el ticket el piso afectado y a las otras dos personas.'},
      {speaker:'agent',english:'That is helpful. If DNS is the cause, the network team will check the resolver and recent changes. We will update the ticket after the service is tested.',spanish:'Eso ayuda. Si DNS es la causa, el equipo de red revisará el resolvedor y los cambios recientes. Actualizaremos el ticket cuando se pruebe el servicio.'},
      {speaker:'user',english:'Thanks. Should I keep the VPN connected?',spanish:'Gracias. ¿Debo mantener conectada la VPN?'},
      {speaker:'agent',english:'Yes, leave it connected unless the service desk advises otherwise. Please use the approved alternative workflow in the meantime.',spanish:'Sí, déjela conectada salvo que la mesa de servicio indique lo contrario. Mientras tanto, use el procedimiento alternativo autorizado.'},
      {speaker:'user',english:'Understood. I will wait for the ticket update.',spanish:'Entendido. Esperaré la actualización del ticket.'}
    ],
    listeningQuestions: [
      q('b1-l1','What works even though the corporate portal does not?',['The guest network.','The corporate DNS resolver.','The portal itself.'],0,'El usuario confirma que la red de invitados funciona.'),
      q('b1-l2','What did the VPN error mention?',['An invalid password.','A DNS server that was not responding.','A disconnected monitor.'],1,'El error indicó que el servidor DNS no respondía.'),
      q('b1-l3','Why was the ticket escalated?',['A possible DNS service incident.','A damaged laptop screen.','A forgotten personal password.'],0,'El agente lo escaló como posible incidente DNS.')
    ],
    speakingPrompts: ['Establish the time, location, affected users, and scope.', 'Ask whether the failure occurs before or after the VPN connects.', 'Describe DNS as a possibility and ask for the exact error safely.', 'Escalate the case and summarize what evidence was collected.'],
    speakingModel: 'The connectivity issue began at approximately nine this morning and affects three employees on the third floor. The VPN connects, but the company portal name does not resolve. DNS may be the cause, although this is not confirmed. I have recorded the exact error and will escalate the ticket to the network team.',
    usefulExpressions: ['Are other users affected? — ¿Hay otras personas afectadas?', 'It may point to a DNS issue. — Podría indicar un problema de DNS.', 'Could you note the exact error? — ¿Podría anotar el error exacto?', 'I will escalate this incident. — Voy a escalar este incidente.', 'We will update the ticket after testing. — Actualizaremos el ticket después de probarlo.']
  },
  {
    id: 'B2', title: 'Servicios en la nube y ciberseguridad',
    description: 'Atiende actividad sospechosa en una cuenta corporativa y coordina medidas seguras.',
    situation: 'Una usuaria recibe avisos de inicio de sesión que no reconoce. Verifica el incidente, protege la cuenta y coordina con seguridad.',
    objectives: ['Verificar señales sin pedir credenciales ni datos sensibles.', 'Explicar MFA, revocación de sesiones y permisos.', 'Comunicar medidas y escalamiento en registro profesional.'],
    vocabulary: [{term:'suspicious sign-in',meaning:'inicio de sesión sospechoso'}, {term:'multi-factor authentication (MFA)',meaning:'autenticación multifactor'}, {term:'session token',meaning:'token de sesión'}, {term:'access permissions',meaning:'permisos de acceso'}, {term:'sign-in alert',meaning:'alerta de inicio de sesión'}, {term:'security team',meaning:'equipo de seguridad'}, {term:'revoke access',meaning:'revocar el acceso'}, {term:'mitigation',meaning:'mitigación'}],
    grammar: { name: 'Voz pasiva, condicionales y estilo indirecto', explanation: 'La voz pasiva centra la atención en la acción o el objeto afectado. Usa condicionales para explicar medidas preventivas y estilo indirecto para transmitir lo que informó otra persona.', examples: ['The sign-in was blocked. — El inicio de sesión fue bloqueado.', 'If you approve the request, the attacker could gain access. — Si aprueba la solicitud, un atacante podría obtener acceso.', 'She reported that she had received an alert. — Informó que había recibido una alerta.'], exercises: [
      q('b2-g1','Choose the passive sentence.',['The system blocked the sign-in.','The sign-in was blocked by the system.','The sign-in blocking the system.'],1,'La pasiva usa be + participio: was blocked.'),
      q('b2-g2','Complete: If you ___ the request, an unauthorized person could enter.',['approve','approved yesterday','will approve'],0,'En el condicional real, la cláusula con if usa presente simple.'),
      q('b2-g3','Change to reported speech: “I received an alert.” She said that she ___ an alert.',['receives','had received','will receive'],1,'El pasado reportado suele retroceder un tiempo: received → had received.')
    ]},
    transcript: [
      {speaker:'agent',english:'Corporate security desk, this is Morgan. You reported an unfamiliar sign-in alert. Is that correct?',spanish:'Mesa de seguridad corporativa, habla Morgan. Informó de una alerta de inicio de sesión desconocida. ¿Es correcto?'},
      {speaker:'user',english:'Yes. I received a notification about a sign-in from another country, and I did not initiate it.',spanish:'Sí. Recibí una notificación de inicio de sesión desde otro país y yo no lo inicié.'},
      {speaker:'agent',english:'Thank you for reporting it. Please do not share your password, verification code, or recovery details with me or anyone who contacts you unexpectedly.',spanish:'Gracias por informarlo. No comparta su contraseña, código de verificación ni datos de recuperación conmigo ni con alguien que le contacte inesperadamente.'},
      {speaker:'user',english:'I have not shared anything. The alert shows a device I do not recognize.',spanish:'No he compartido nada. La alerta muestra un dispositivo que no reconozco.'},
      {speaker:'agent',english:'We will treat the alert as suspicious. Did you approve an MFA request around that time?',spanish:'Trataremos la alerta como sospechosa. ¿Aprobó una solicitud MFA por esas horas?'},
      {speaker:'user',english:'No. I received two prompts and selected deny both times.',spanish:'No. Recibí dos solicitudes y las rechacé ambas veces.'},
      {speaker:'agent',english:'That was the right action. The security team has been notified. We are revoking active sessions and reviewing recent access permissions.',spanish:'Hizo lo correcto. Se notificó al equipo de seguridad. Estamos revocando las sesiones activas y revisando los permisos de acceso recientes.'},
      {speaker:'user',english:'Should I change my password now?',spanish:'¿Debo cambiar mi contraseña ahora?'},
      {speaker:'agent',english:'Use the company sign-in page that you normally open from your trusted bookmark. If the security team confirms credential exposure, they will guide a reset there. Do not follow links in the alert email.',spanish:'Use la página corporativa de acceso que abre normalmente desde su marcador de confianza. Si el equipo confirma que las credenciales quedaron expuestas, le guiará para restablecerlas allí. No siga enlaces del correo de alerta.'},
      {speaker:'user',english:'I opened the portal directly. It shows that my sessions have been signed out.',spanish:'Abrí directamente el portal. Indica que mis sesiones se cerraron.'},
      {speaker:'agent',english:'That is an expected mitigation. Please keep MFA enabled and report any new prompt that you did not initiate. The investigation is still in progress.',spanish:'Esa es una medida de mitigación prevista. Mantenga MFA activada e informe de cualquier solicitud nueva que no haya iniciado. La investigación sigue en curso.'},
      {speaker:'user',english:'I will. Can I continue working in the cloud application?',spanish:'Lo haré. ¿Puedo seguir trabajando en la aplicación en la nube?'},
      {speaker:'agent',english:'Wait for the security team to confirm that your access is safe. If the account remains restricted, use the approved continuity process and do not create a personal account to bypass the controls.',spanish:'Espere a que el equipo de seguridad confirme que su acceso es seguro. Si la cuenta sigue restringida, use el proceso de continuidad autorizado y no cree una cuenta personal para eludir los controles.'},
      {speaker:'user',english:'Understood. I will follow the approved process.',spanish:'Entendido. Seguiré el procedimiento autorizado.'},
      {speaker:'agent',english:'I have added your report to the incident record. The security team will contact you through the official channel.',spanish:'Añadí su informe al registro del incidente. El equipo de seguridad se comunicará con usted por el canal oficial.'},
      {speaker:'user',english:'Thank you for the clear instructions.',spanish:'Gracias por las instrucciones claras.'}
    ],
    listeningQuestions: [
      q('b2-l1','What did the user do with the MFA prompts?',['Approved both.','Denied both.','Forwarded them to support.'],1,'La persona rechazó ambas solicitudes que no inició.'),
      q('b2-l2','What security measures were being taken?',['Revoking sessions and reviewing permissions.','Disabling all security controls.','Creating a personal account.'],0,'El agente describe revocar sesiones y revisar permisos.'),
      q('b2-l3','How should the user open the corporate sign-in page?',['Through a link in the alert email.','From a trusted bookmark or known route.','From a public message board.'],1,'El agente aconseja usar una ruta conocida y no enlaces de alerta.')
    ],
    speakingPrompts: ['Acknowledge a suspicious sign-in report and ask whether the user initiated it.', 'Explain MFA safely without asking for a code.', 'Describe session revocation using the passive voice.', 'Summarize mitigation and explain how updates will be communicated.'],
    speakingModel: 'Thank you for reporting the unfamiliar sign-in. Please do not share your password or verification code. The MFA requests were denied, and the active sessions are being revoked while the permissions are reviewed. The investigation is still in progress; the security team will update you through the official channel.',
    usefulExpressions: ['Thank you for reporting this. — Gracias por informar de esto.', 'Please do not share your verification code. — No comparta su código de verificación.', 'The active sessions are being revoked. — Se están revocando las sesiones activas.', 'The investigation is still in progress. — La investigación sigue en curso.', 'Use the official channel. — Use el canal oficial.']
  },
  {
    id: 'C1', title: 'Gestión avanzada de incidentes TIC',
    description: 'Coordina la respuesta a una interrupción de nube con impacto en operaciones y SLA.',
    situation: 'Una interrupción de un proveedor de nube afecta procesamiento, informes y operaciones. Hay que priorizar, coordinar continuidad y preparar el análisis posterior.',
    objectives: ['Valorar impacto, alcance y dependencias del servicio.', 'Priorizar la respuesta y alinear equipos bajo el SLA.', 'Comunicar incertidumbre con precisión y cerrar con causa raíz y acciones.'],
    vocabulary: [{term:'service-level agreement (SLA)',meaning:'acuerdo de nivel de servicio'}, {term:'root cause analysis',meaning:'análisis de causa raíz'}, {term:'business continuity',meaning:'continuidad del negocio'}, {term:'incident severity',meaning:'severidad del incidente'}, {term:'dependency',meaning:'dependencia'}, {term:'workaround',meaning:'solución provisional'}, {term:'recovery point',meaning:'punto de recuperación'}, {term:'executive briefing',meaning:'informe ejecutivo'}],
    grammar: { name: 'Condicionales avanzados, matices y argumentación', explanation: 'En informes ejecutivos distingue hechos confirmados de hipótesis con “appears to”, “is likely to” o “has yet to be confirmed”. Los condicionales mixtos vinculan una acción previa con un resultado actual; usa concesiones para matizar una recomendación.', examples: ['Had the failover completed, the queue would now be processing normally. — Si la conmutación hubiera terminado, la cola ya procesaría con normalidad.', 'Although the workaround reduced the impact, it did not restore the SLA target. — Aunque la solución provisional redujo el impacto, no restauró el objetivo del SLA.', 'The root cause has yet to be confirmed. — Aún no se ha confirmado la causa raíz.'], exercises: [
      q('c1-g1','Complete the mixed conditional: Had failover completed, the service ___ available now.',['would be','will be','would have being'],0,'La condición pasada invertida se combina con resultado presente: would be.'),
      q('c1-g2','Choose the cautious status statement.',['The vendor caused it; we know everything.','The disruption appears linked to the provider; root cause is still under investigation.','The service is permanently broken.'],1,'“Appears linked” y “still under investigation” separan hipótesis de hechos confirmados.'),
      q('c1-g3','Choose the best concession.',['Although the workaround reduced impact, it did not restore the SLA target.','Because the workaround reduced impact, so it did not restore the SLA target.','Despite the workaround reduced impact, it did not restore the SLA target.'],0,'Although introduce una cláusula completa y contrasta dos resultados.')
    ]},
    transcript: [
      {speaker:'agent',english:'Incident bridge, this is Taylor, the incident manager. We have a regional cloud disruption affecting order processing and analytics. Please confirm your workstream and current impact.',spanish:'Puente del incidente, habla Taylor, responsable del incidente. Tenemos una interrupción regional de nube que afecta el procesamiento de pedidos y el análisis. Confirme su área y el impacto actual.'},
      {speaker:'user',english:'The application team owns order processing. New orders are queued but not confirmed; analytics dashboards are delayed by approximately forty minutes.',spanish:'El equipo de aplicaciones es responsable del procesamiento de pedidos. Los pedidos nuevos quedan en cola, pero no se confirman; los paneles analíticos llevan unos cuarenta minutos de retraso.'},
      {speaker:'agent',english:'Understood. Is data integrity at risk, or is this currently an availability and latency issue?',spanish:'Entendido. ¿Está en riesgo la integridad de los datos o se trata actualmente de disponibilidad y latencia?'},
      {speaker:'user',english:'So far, we have found no evidence of data loss. We have not yet validated every downstream consumer.',spanish:'Hasta ahora no encontramos indicios de pérdida de datos. Aún no validamos todos los sistemas consumidores posteriores.'},
      {speaker:'agent',english:'Please keep that distinction in the status update. We should not describe integrity as confirmed until the reconciliation checks are complete.',spanish:'Mantenga esa distinción en la actualización. No debemos dar la integridad por confirmada hasta completar las comprobaciones de conciliación.'},
      {speaker:'user',english:'The provider reports elevated error rates in the message service. Our retry queue is approaching its retention threshold.',spanish:'El proveedor informa de tasas elevadas de error en el servicio de mensajes. Nuestra cola de reintentos se acerca al límite de retención.'},
      {speaker:'agent',english:'That raises the severity because order events could expire. Can the approved continuity workflow reduce risk without replaying messages prematurely?',spanish:'Eso eleva la severidad, porque los eventos de pedidos podrían caducar. ¿El procedimiento de continuidad aprobado puede reducir el riesgo sin reproducir los mensajes antes de tiempo?'},
      {speaker:'user',english:'Yes. We can route new transactions to the secondary region, but historical events must remain paused until the provider confirms the partition is stable.',spanish:'Sí. Podemos dirigir las transacciones nuevas a la región secundaria, pero los eventos históricos deben permanecer pausados hasta que el proveedor confirme que la partición es estable.'},
      {speaker:'agent',english:'Proceed with the documented failover, subject to the change lead’s approval. Record the decision time, the affected services, and the recovery-point implications.',spanish:'Procedan con la conmutación documentada, sujeta a la aprobación de quien coordina el cambio. Registren la hora de decisión, los servicios afectados y las implicaciones para el punto de recuperación.'},
      {speaker:'user',english:'Approval is recorded. The secondary region is accepting new traffic. Queue depth is stabilizing, although confirmation latency remains above the SLA threshold.',spanish:'La aprobación quedó registrada. La región secundaria acepta tráfico nuevo. La profundidad de la cola se estabiliza, aunque la latencia de confirmación sigue por encima del umbral del SLA.'},
      {speaker:'agent',english:'Thank you. State that the workaround has reduced the operational impact, but service restoration has not yet been verified against the SLA. Ask the provider for the next update and evidence of recovery.',spanish:'Gracias. Indique que la solución provisional redujo el impacto operativo, pero que la restauración aún no se verificó frente al SLA. Solicite al proveedor la siguiente actualización y evidencias de recuperación.'},
      {speaker:'user',english:'The provider expects another update in fifteen minutes. They have not confirmed a root cause; a control-plane issue is one hypothesis.',spanish:'El proveedor espera dar otra actualización en quince minutos. No confirmó la causa raíz; un problema del plano de control es una hipótesis.'},
      {speaker:'agent',english:'For the executive briefing, separate confirmed impact, mitigation, residual risk, and unknowns. Avoid attributing the incident to that hypothesis until the evidence supports it.',spanish:'En el informe ejecutivo, separe el impacto confirmado, la mitigación, el riesgo residual y las incógnitas. No atribuya el incidente a esa hipótesis hasta que haya pruebas.'},
      {speaker:'user',english:'I will include the order backlog, the secondary-region routing, and the fact that analytics remain delayed. We also need to preserve logs for the review.',spanish:'Incluiré el retraso de pedidos, el enrutamiento por la región secundaria y que los análisis continúan demorados. También debemos conservar los registros para la revisión.'},
      {speaker:'agent',english:'Agreed. Once the primary service is stable, validate reconciliation, drain the queue in a controlled manner, and obtain business-owner approval before closing the incident.',spanish:'De acuerdo. Cuando el servicio primario esté estable, validen la conciliación, vacíen la cola de forma controlada y obtengan la aprobación del área de negocio antes de cerrar el incidente.'},
      {speaker:'user',english:'After recovery, we will compare the timeline with the SLA, identify the initiating condition, and assign corrective actions with owners and due dates.',spanish:'Después de la recuperación, compararemos la cronología con el SLA, identificaremos la condición inicial y asignaremos acciones correctivas con responsables y fechas límite.'},
      {speaker:'agent',english:'That will support a useful root cause analysis. The closure report should distinguish immediate mitigation from long-term prevention and document any remaining service credits or follow-up obligations.',spanish:'Eso respaldará un análisis de causa raíz útil. El informe de cierre debe distinguir la mitigación inmediata de la prevención a largo plazo y registrar los créditos de servicio o compromisos pendientes.'},
      {speaker:'user',english:'Understood. I will circulate the next status update after the provider’s evidence is reviewed.',spanish:'Entendido. Distribuiré la siguiente actualización de estado después de revisar las pruebas del proveedor.'}
    ],
    listeningQuestions: [
      q('c1-l1','What was confirmed about data integrity at the time of the call?',['No evidence of data loss had been found, but validation was incomplete.','All downstream data was fully reconciled.','The provider had confirmed permanent data loss.'],0,'El equipo no encontró pérdida de datos, pero no había validado todos los consumidores.'),
      q('c1-l2','Why was the queue a priority?',['It was near its retention threshold.','It contained old passwords.','It had already been deleted.'],0,'Los eventos podían caducar al acercarse al límite de retención.'),
      q('c1-l3','How should the possible control-plane issue be described?',['As the confirmed root cause.','As one hypothesis pending evidence.','As an unrelated outage.'],1,'El proveedor no confirmó la causa; es una hipótesis.'),
      q('c1-l4','What should happen before incident closure?',['Drain the queue without checks.','Validate reconciliation and obtain business-owner approval.','Delete the incident records.'],1,'Primero deben validar la conciliación y obtener aprobación del negocio.')
    ],
    speakingPrompts: ['Deliver a concise impact statement that separates availability, latency, and data integrity.', 'Recommend a continuity action while stating its risks and approval dependency.', 'Give an executive update that distinguishes confirmed facts from the provider’s hypothesis.', 'Describe closure criteria and the evidence needed for root cause analysis.'],
    speakingModel: 'Order processing is delayed in the affected region, while analytics are approximately forty minutes behind. We have found no evidence of data loss, although reconciliation remains incomplete. Subject to the change lead’s approval, routing new transactions to the secondary region should reduce operational impact. The provider has not confirmed a root cause; the control-plane issue remains a hypothesis. Before closure, we will validate reconciliation, drain the queue in a controlled manner, and document corrective actions against the SLA.',
    usefulExpressions: ['We have found no evidence of data loss. — No hemos encontrado indicios de pérdida de datos.', 'The root cause has yet to be confirmed. — Aún no se ha confirmado la causa raíz.', 'The workaround has reduced the operational impact. — La solución provisional redujo el impacto operativo.', 'This remains a hypothesis pending evidence. — Sigue siendo una hipótesis pendiente de pruebas.', 'Please validate reconciliation before closure. — Valide la conciliación antes del cierre.']
  }
];
