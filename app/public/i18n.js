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

// Jokes for results, said by the cartoon guys in comic speech bubbles (it's a party game,
// nobody is real). {who} = the player's nickname.
// roast:    one neighbour speaks (wrong pick right next to him)
// sandwich: [left guy, right guy] (you are between two)
// kid:      the kid speaks -> never a dick joke, just a telling-off
// miss:     wrong but not next to anybody: the nearest guy shouts it from a distance
// kidMiss:  same, but the nearest one is a kid -> clean
// alone:    wrong in an empty bathroom: you talk to yourself
const JOKES = {
  es: {
    roast: [
      '¡{who}, te he visto el pito! Tranquilo, me ha hecho falta lupa. 🔍',
      'Espera, que me pongo las gafas… Nada, sigo sin verla. 👓',
      'Esto es un urinario, no un concurso de medidas. Y has perdido. 🤏',
      'Desde aquí se te ve todo. Bueno, «todo»… 🤏',
      'Ya sé tu talla, {who}. No se lo diré a nadie. (Se lo diré a todos.)',
      'Te he visto. Lo sé. Y tú sabes que lo sé. 👀',
      '¿Con tanto sitio libre te pones aquí? ¿Buscas compañía o comparación?',
      'Uy, un cacahuete. Ahora me ha entrado hambre. 🥜',
      '¿Te hago una foto? Mejor no, que no saldría nada. 📸',
      'Qué mona. ¿Le has puesto nombre? 🐣',
    ],
    sandwich: [
      ['¡Le he visto el pito!', '¿Dónde? Yo no veo nada. 🔍'],
      ['Oye, ¿tú ves algo?', 'Ni con lupa. 🔬'],
      ['Bocadillo de {who}…', '…de los pequeños. 🥪🤏'],
    ],
    kid: [
      '¡Eh! ¡Que soy un niño! Ponte más lejos. 😠',
      '¡Papááá, este señor se ha puesto muy cerca! 😤',
    ],
    miss: [
      '{who}, desde aquí no se ve nada… y de cerca sospecho que tampoco. 🤏',
      'Has fallado, pero tranquilo: con algo tan pequeño nadie se fija. 🔍',
      'Ese no era el sitio, {who}. Igual que esa no era la talla que esperabas. 🤏',
      'Eliges urinario igual que mides: fatal. 📏',
      'Casi, {who}. Como tu pito: casi. 🤏',
      'Te he visto dudar. Y también he visto lo otro, pero no diré nada. 🤐',
      'Error de novato. ¿Es tu primera vez meando de pie? 🧍',
      'Mal sitio, {who}. Pero bonita… eh… técnica. 👀',
    ],
    kidMiss: ['¡Hasta yo lo hago mejor! 😝', 'Mi profe dice que eso está mal. 📏'],
    alone: ['Un baño entero para mí y elijo el peor sitio. 🤦', 'Si entra alguien, me toca bocadillo. Bien hecho, yo. 🤦', 'Ojalá no entre nadie… 🙏'],
    praise: ['Elegancia urinaria nivel experto. 🎩', 'De manual. Tu próstata y tu dignidad, intactas. 👌', 'Así se mea, señores. 🏅', 'Distancia perfecta. Nadie ha visto nada. 😎'],
  },
  en: {
    roast: [
      '{who}, I can see your dick! Don\'t worry, I needed a magnifying glass. 🔍',
      'Hang on, let me get my glasses… Nope, still can\'t see it. 👓',
      'This is a urinal, not a measuring contest. And you lost. 🤏',
      'From here I can see everything. Well, "everything"… 🤏',
      'I know your size now, {who}. I won\'t tell anyone. (I\'ll tell everyone.)',
      'I saw. I know. And you know I know. 👀',
      'All that free space and you stand here? Company or comparison?',
      'Oh, a peanut. Now I\'m hungry. 🥜',
      'Want me to take a photo? Better not, nothing would show. 📸',
      'Aww, cute. Did you give it a name? 🐣',
    ],
    sandwich: [
      ['I saw his dick!', 'Where? I can\'t see anything. 🔍'],
      ['Hey, can you see anything?', 'Not even with a magnifier. 🔬'],
      ['A {who} sandwich…', '…a small one. 🥪🤏'],
    ],
    kid: [
      'Hey! I\'m a kid! Go further away. 😠',
      'Daaad, this man is standing too close! 😤',
    ],
    miss: [
      '{who}, I can\'t see a thing from here… and I bet up close it\'s the same. 🤏',
      'Wrong spot, but relax: with something that small nobody notices. 🔍',
      'That wasn\'t the spot, {who}. Just like that wasn\'t the size you hoped for. 🤏',
      'You pick urinals the way you measure: badly. 📏',
      'Almost, {who}. Like your dick: almost. 🤏',
      'I saw you hesitate. I also saw the other thing, but my lips are sealed. 🤐',
      'Rookie mistake. First time peeing standing up? 🧍',
      'Wrong spot, {who}. Nice… er… technique, though. 👀',
    ],
    kidMiss: ['Even I can do better! 😝', 'My teacher says that\'s wrong. 📏'],
    alone: ['A whole bathroom to myself and I pick the worst spot. 🤦', 'If someone comes in, I\'m in a sandwich. Well done, me. 🤦', 'Please nobody come in… 🙏'],
    praise: ['Expert-level urinal elegance. 🎩', 'Textbook. Bladder and dignity intact. 👌', 'That, gentlemen, is how you pee. 🏅', 'Perfect distance. Nobody saw a thing. 😎'],
  },
};

let lang = 'es';
export const setLang = (l) => { lang = l in LANGS ? l : 'es'; document.documentElement.lang = lang; };
export const getLang = () => lang;
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
export const t = (key, vars = {}) => fill((lang === 'en' ? EN : ES)[key] ?? EN[key] ?? key, vars);
// A joke of that kind: a string, or [left, right] for a sandwich.
export const pick = (kind, seed, vars = {}) => {
  const a = JOKES[lang][kind], j = a[Math.abs(seed) % a.length];
  return Array.isArray(j) ? j.map((x) => fill(x, vars)) : fill(j, vars);
};
export const JOKE_LISTS = JOKES; // for tests
