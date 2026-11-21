// UI texts. Spanish (Spain) is the default; the organizer picks the game's language.
// t('key', { n: 3 }) replaces {n}. Lists (jokes) are picked with pick(key, seed).

export const LANGS = { es: 'Español', en: 'English' };

const ES = {
  'app.name': 'El Test del Urinario', 'app.short': 'Test del Urinario',
  'home.tagline': '¿Dónde meas <em>tú</em>? Juega con tus amigos y descubre quién no tiene ni idea de urinarios.',
  'home.create': 'Organiza una partida', 'home.nickname': 'Tu apodo', 'home.count': 'Número de situaciones', 'home.lang': 'Idioma de la partida',
  'home.countHint': 'Situaciones al azar; las que ya has jugado en este móvil salen las últimas.',
  'home.createBtn': 'Crear partida 🚽', 'home.join': 'Únete a una partida', 'home.code': 'Código de la partida', 'home.joinBtn': 'Entrar',
  'home.placeholder': 'p. ej. El Meón',
  'count.n': '{n} situaciones', 'count.quick': '{n} situaciones (rapidito)', 'count.long': '{n} situaciones (próstata de acero)',
  'game.label': 'Partida', 'game.notFound': 'Partida no encontrada', 'game.expired': 'Puede que haya caducado (como tu dignidad).', 'game.home': 'Inicio',
  'join.title': 'Únete a la partida {code}', 'join.waiting': '{n} jugador(es) esperando', 'join.inProgress': ' · partida en curso', 'join.btn': 'Entrar',
  'lobby.invite': 'Invita a tus amigos', 'lobby.copy': 'Copiar enlace', 'lobby.share': 'Compartir…', 'lobby.players': 'Jugadores ({n})',
  'lobby.waiting': 'Esperando a que el organizador empiece… ve calentando la vejiga.',
  'lobby.copied': '¡Enlace copiado!', 'lobby.copyPrompt': 'Copia este enlace:', 'lobby.shareText': '¡Juega al test del urinario con nosotros!',
  'host.in': '{n} jugador(es) dentro', 'host.start': 'Empezar', 'host.finished': '<b>{done}/{n}</b> han terminado', 'host.reveal': 'Ver resultados',
  'host.confirmPending': '{n} jugador(es) aún no han terminado. ¿Mostrar resultados igualmente?',
  'play.answered': '{n}/{total} respondidas', 'play.hint': 'Entras por la izquierda. <b>Toca donde meas.</b>', 'play.locked': 'Respuesta bloqueada ✓ No hay vuelta atrás.',
  'play.back': '← Atrás', 'play.next': 'Siguiente →',
  'wait.title': '¡Hecho!', 'wait.host': 'Muestra los resultados cuando estéis todos. Que se suban la bragueta.',
  'wait.player': 'Esperando a que el organizador muestre los resultados… lávate las manos mientras.',
  'wait.who': 'Quién ha terminado', 'wait.review': 'Revisar mis respuestas',
  'res.title': '🏆 Resultados', 'res.tapHint': 'Toca un jugador para ver qué eligió.', 'res.showing': 'Respuestas de', 'res.you': 'Tú', 'res.youSuffix': ' (tú)',
  'res.gotIt': '{who}: ¡bien! ✓', 'res.wrong': '{who}: mal ✗', 'res.noAnswer': '{who}: no respondió', 'res.correct': 'Correcto', 'res.popular': 'Lo más elegido',
  'res.follow': 'Si el organizador empieza otra ronda, te llevaremos allí automáticamente.',
  'res.newGame': 'Nueva partida', 'res.again': 'Otra ronda, mismo grupo:', 'res.againBtn': 'Otra ronda',
  'res.awards': 'Premios', 'award.master': '🧠 Maestro del urinario', 'award.flasher': '🍆 Exhibicionista del día', 'award.flasherN': '{n} veces pegado a alguien',
  'award.none': 'Nadie se ha arrimado. Qué grupo tan decente. 👏',
  'spot.urinal': 'urinario {n}', 'spot.stall': 'el váter', 'spot.low': 'el urinario de niño ({n})',
  'who.you': 'Tú',
  'err.no_nickname': 'Elige un apodo', 'err.not_found': 'Partida no encontrada', 'err.full': 'La partida está llena',
  'err.nickname_taken': 'Ese apodo ya está pillado en esta partida', 'err.host_only': 'Solo el organizador puede hacer eso',
  'err.join_first': 'Primero únete a la partida', 'err.not_playing': 'La partida no acepta respuestas ahora',
  'err.unknown_scenario': 'Situación desconocida', 'err.bad_spot': 'Ahí no puedes mear', 'err.game_over': 'Esta partida ya ha terminado',
  'err.reveal_first': 'Primero muestra los resultados', 'err.generic': 'Algo ha salido mal',
};

const EN = {
  'app.name': 'The Urinal Test', 'app.short': 'Urinal Test',
  'home.tagline': 'Where would <em>you</em> pee? Play with your friends and find out who has no clue about urinals.',
  'home.create': 'Organize a game', 'home.nickname': 'Your nickname', 'home.count': 'Number of situations', 'home.lang': 'Game language',
  'home.countHint': 'Random situations; the ones you already played on this phone come last.',
  'home.createBtn': 'Create game 🚽', 'home.join': 'Join a game', 'home.code': 'Game code', 'home.joinBtn': 'Join',
  'home.placeholder': 'e.g. Captain Splash',
  'count.n': '{n} situations', 'count.quick': '{n} situations (quickie)', 'count.long': '{n} situations (iron bladder)',
  'game.label': 'Game', 'game.notFound': 'Game not found', 'game.expired': 'It may have expired (like your dignity).', 'game.home': 'Home',
  'join.title': 'Join game {code}', 'join.waiting': '{n} player(s) waiting', 'join.inProgress': ' · game in progress', 'join.btn': 'Join',
  'lobby.invite': 'Invite your friends', 'lobby.copy': 'Copy link', 'lobby.share': 'Share…', 'lobby.players': 'Players ({n})',
  'lobby.waiting': 'Waiting for the organizer to start… warm up that bladder.',
  'lobby.copied': 'Link copied!', 'lobby.copyPrompt': 'Copy this link:', 'lobby.shareText': 'Play the urinal test with us!',
  'host.in': '{n} player(s) in', 'host.start': 'Start game', 'host.finished': '<b>{done}/{n}</b> finished', 'host.reveal': 'Reveal results',
  'host.confirmPending': '{n} player(s) have not finished. Reveal anyway?',
  'play.answered': '{n}/{total} answered', 'play.hint': 'You came in from the left. <b>Tap where you would pee.</b>', 'play.locked': 'Answer locked ✓ No take-backs.',
  'play.back': '← Back', 'play.next': 'Next →',
  'wait.title': 'All done!', 'wait.host': 'Reveal the results when everybody is ready. Zip up first.',
  'wait.player': 'Waiting for the organizer to reveal the results… go wash your hands.',
  'wait.who': 'Who has finished', 'wait.review': 'Review my answers',
  'res.title': '🏆 Results', 'res.tapHint': 'Tap a player to see what they picked.', 'res.showing': 'Answers of', 'res.you': 'You', 'res.youSuffix': ' (you)',
  'res.gotIt': '{who}: nailed it ✓', 'res.wrong': '{who}: wrong ✗', 'res.noAnswer': '{who}: no answer', 'res.correct': 'Correct', 'res.popular': 'Most picked',
  'res.follow': 'If the organizer starts another round, you will be moved there automatically.',
  'res.newGame': 'New game', 'res.again': 'Another round, same group:', 'res.againBtn': 'Play again',
  'res.awards': 'Awards', 'award.master': '🧠 Urinal master', 'award.flasher': '🍆 Flasher of the day', 'award.flasherN': 'right next to someone {n} times',
  'award.none': 'Nobody got too close. What a decent group. 👏',
  'spot.urinal': 'urinal {n}', 'spot.stall': 'the stall', 'spot.low': 'the kid urinal ({n})',
  'who.you': 'You',
  'err.no_nickname': 'Pick a nickname', 'err.not_found': 'Game not found', 'err.full': 'Game is full',
  'err.nickname_taken': 'That nickname is taken in this game', 'err.host_only': 'Only the organizer can do that',
  'err.join_first': 'Join the game first', 'err.not_playing': 'The game is not accepting answers',
  'err.unknown_scenario': 'Unknown scenario', 'err.bad_spot': 'You cannot pee there', 'err.game_over': 'This game is already over',
  'err.reveal_first': 'Reveal the results first', 'err.generic': 'Something went wrong',
};

// Jokes for results. Cartoon guys only, it's a party game. {who} = player name.
// "roast": wrong pick right next to a guy. "sandwich": between two guys.
// "kid": next to a kid -> never a dick joke, just a telling-off.
const JOKES = {
  es: {
    roast: [
      '¡{who}, te he visto el pito! Tranquilo, ha hecho falta lupa. 🔍',
      'El de al lado ha mirado de reojo… y ha tenido que ponerse las gafas. 👓',
      'Era un urinario, no un concurso de medidas. Y lo has perdido. 🤏',
      'Desde ahí se te ve todo. Bueno, «todo»… 🤏',
      'Tu vecino ya sabe tu talla. Y se sigue riendo.',
      'Te has puesto al lado. Él lo ha visto. Lo sabe. Tú sabes que lo sabe. 👀',
      '{who}, tan cerca que podía contarte los pelos. Y no había muchos más que contar.',
      'Tu vecino ha visto tu cacahuete y ahora tiene hambre. 🥜',
      'Pegadito, pegadito… ¿buscabas compañía o comparación? (Spoiler: has perdido.)',
      '¡Alerta de mirón! Y lo que ha visto no da ni para una foto. 📸',
    ],
    sandwich: [
      '¡Bocadillo! Dos tíos te han visto el pito a la vez. Uno ha dicho «ah». El otro, «¿dónde?». 🥪',
      '{who} entre dos y aun así no se ve nada. Impresionante. 🔬',
      'Te han rodeado por los dos lados. Ahora hay dos testigos de tu miniatura. 🤏🤏',
    ],
    kid: [
      '¡{who}, que hay un niño! Distancia, por favor. 🙅',
      'Al lado de un crío… su padre te está mirando fatal. 😠',
    ],
    praise: ['Elegancia urinaria nivel experto. 🎩', 'De manual. Tu próstata y tu dignidad, intactas. 👌', 'Así se mea, señores. 🏅', 'Distancia perfecta. Nadie ha visto nada. 😎'],
  },
  en: {
    roast: [
      '{who}, I can see your dick! Don\'t worry, it took a magnifying glass. 🔍',
      'Your neighbour took a peek… and reached for his glasses. 👓',
      'That was a urinal, not a measuring contest. And you lost. 🤏',
      'From there everything is visible. Well, "everything"… 🤏',
      'The guy next to you now knows your size. He\'s still laughing.',
      'You went right next to him. He saw. He knows. You know he knows. 👀',
      '{who}, so close he could have counted the hairs. Not much else to count.',
      'Your neighbour saw your peanut and now he\'s hungry. 🥜',
      'Snuggled right up… were you after company or a comparison? (Spoiler: you lost.)',
      'Peeping alert! And what he saw wasn\'t even worth a photo. 📸',
    ],
    sandwich: [
      'Sandwich! Two guys saw your dick at once. One said "oh". The other said "where?". 🥪',
      '{who} with two guys looking and still nothing to see. Impressive. 🔬',
      'Surrounded on both sides. Now there are two witnesses to your miniature. 🤏🤏',
    ],
    kid: [
      '{who}, there\'s a kid there! Distance, please. 🙅',
      'Right next to a child… his dad is giving you the stink eye. 😠',
    ],
    praise: ['Expert-level urinal elegance. 🎩', 'Textbook. Bladder and dignity intact. 👌', 'That, gentlemen, is how you pee. 🏅', 'Perfect distance. Nobody saw a thing. 😎'],
  },
};

let lang = 'es';
export const setLang = (l) => { lang = l in LANGS ? l : 'es'; document.documentElement.lang = lang; };
export const getLang = () => lang;
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
export const t = (key, vars = {}) => fill((lang === 'en' ? EN : ES)[key] ?? EN[key] ?? key, vars);
export const pick = (kind, seed, vars = {}) => { const a = JOKES[lang][kind]; return fill(a[Math.abs(seed) % a.length], vars); };
