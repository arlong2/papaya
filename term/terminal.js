/**
 * Terminal 3000 - Retro CRT Terminal
 */

// Creates initial options
const createOptions = opts => Object.assign({}, {
  banner: 'Hello World',
  prompt: () => '$ > ',
  tickrate: 1000 / 60,
  buflen: 8,
  commands: {}
}, opts || {});

// Creates our textarea element
const createElement = root => {
  const el = document.createElement('textarea');
  el.contentEditable = true;
  el.spellcheck = false;
  el.value = '';

  root.appendChild(el);

  return el;
};

// Keys that must be ignored

// Sets text selection range
const setSelectionRange = input => {
  const length = input.value.length;

  if (input.setSelectionRange) {
    input.focus();
    input.setSelectionRange(length, length);
  } else if (input.createTextRange) {
    const range = input.createTextRange();
    range.collapse(true);
    range.moveEnd('character', length);
    range.moveStart('character', length);
    range.select();
  }
};

// Gets the font size of an element
const getFontSize = element => parseInt(window.getComputedStyle(element)
  .getPropertyValue('font-size'), 10);

// Creates the rendering loop
const renderer = (tickrate, onrender) => {
  let lastTick = 0;

  const tick = (time) => {
    const now = performance.now();
    const delta = now - lastTick;

    if (delta > tickrate) {
      lastTick = now - (delta % tickrate);

      onrender();
    }

    window.requestAnimationFrame(tick);
  };

  return tick;
};

// Pronts buffer onto the textarea
const printer = ($element, buflen, getAutoScrollState) => {
  let lastContentLength = $element.value.length;
  
  return buffer => {
    if (buffer.length > 0) {
      const len = Math.min(buflen, buffer.length);
      const val = buffer.splice(0, len);

      // Check if user was at the bottom before adding new content
      const wasAtBottom = $element.scrollTop >= ($element.scrollHeight - $element.clientHeight - 10);
      
      // Get the current auto-scroll state
      const shouldAutoScroll = getAutoScrollState();
      
      // Store scroll position before adding content
      const oldScrollHeight = $element.scrollHeight;

      $element.value += val.join('');

      setSelectionRange($element);
      
      // Auto-scroll if user was at bottom OR if auto-scroll is enabled (e.g., after Ctrl+C)
      if (wasAtBottom || shouldAutoScroll) {
        // Use requestAnimationFrame to ensure DOM has updated before scrolling
        requestAnimationFrame(() => {
          const newScrollHeight = $element.scrollHeight;
          const viewportHeight = $element.clientHeight;
          
          // Always scroll to bottom to ensure all new content is visible
          $element.scrollTop = newScrollHeight - viewportHeight;
          
          // If that doesn't reach the very bottom, scroll to the absolute bottom
          if ($element.scrollTop < newScrollHeight - viewportHeight) {
            $element.scrollTop = newScrollHeight;
          }
        });
      }

      lastContentLength = $element.value.length;
      return true;
    }

    return false;
  };
};

// Parses input
const parser = onparsed => str => {
  if (str.length) {
    const args = str.split(' ').map(s => s.trim());
    const cmd = args.splice(0, 1)[0];
    console.debug(cmd, args);
    onparsed(cmd, ...args);
  }
};

// Command executor
const executor = commands => (cmd, ...args) => cb => {
  try {
    if (commands[cmd]) {
      const result = commands[cmd](...args);
      
      // Handle async commands (Promises)
      if (result && typeof result.then === 'function') {
        result
          .then(output => cb(output + '\n'))
          .catch(error => cb(`Error: ${error}\n`));
      } else {
        // Handle sync commands
        cb(result + '\n');
      }
    } else {
      cb(`No such command '${cmd}'\n`);
    }
  } catch (e) {
    console.warn(e);
    cb(`Exception: ${e}\n`);
  }
};

// Handle keyboard events
const keyboard = (parse, scrollToBottom) => {
  let input = [];
  const keys = {8: 'backspace', 13: 'enter'};
  const ignoreKey = code => code >= 33 && code <= 40;
  const key = ev => keys[ev.which || ev.keyCode];

  return {
    keypress: (ev) => {
      if (key(ev) === 'enter') {
        const str = input.join('').trim();
        parse(str);
        input = [];
      } else if (key(ev) !== 'backspace') {
        input.push(String.fromCharCode(ev.which || ev.keyCode));
      }
    },

    keydown: (ev) => {
      // Handle Ctrl+C
      if (ev.ctrlKey && ev.keyCode === 67) {
        ev.preventDefault();
        input = []; // Clear current input
        scrollToBottom(); // Scroll to bottom and focus
        return;
      }
      
      if (key(ev) === 'backspace') {
        if (input.length > 0) {
          input.pop();
        } else {
          ev.preventDefault();
        }
      } else if (ignoreKey(ev.keyCode)) {
        ev.preventDefault();
      }
    }
  };
};

// Creates the terminal
export const terminal = (opts) => {
  let buffer = []; // What will be output to display
  let busy = false; // If we cannot type at the moment
  let autoScrollEnabled = false; // Track if auto-scroll should be forced

  const {prompt, banner, commands, buflen, tickrate} = createOptions(opts);
  const $root = document.querySelector('#terminal');
  const $element = createElement($root);
  const fontSize = getFontSize($element);
  const width = $element.offsetWidth;
  const cwidth = Math.round((width / fontSize) * 1.9); // FIXME: Should be calculated via canvas

  const output = (output, center) => {
    let lines = output.split(/\n/);
    if (center) {
      lines = lines.map(line => line.length > 0
        ? line.padStart(line.length + ((cwidth / 2) - (line.length / 2)), ' ')
        : line);
    }

    const append = lines.join('\n') + '\n' + prompt();
    buffer = buffer.concat(append.split(''));
  };

  const getAutoScrollState = () => autoScrollEnabled;
  const print = printer($element, buflen, getAutoScrollState);
  const execute = executor(commands);
  const onrender = () => (busy = print(buffer));
  const onparsed = (cmd, ...args) => execute(cmd, ...args)(output);
  const render = renderer(tickrate, onrender);
  const parse = parser(onparsed);
  const focus = () => setTimeout(() => $element.focus(), 1);
  const scrollToBottom = () => {
    $element.scrollTop = $element.scrollHeight;
    setSelectionRange($element);
    autoScrollEnabled = true; // Enable auto-scroll after Ctrl+C
  };
  const kbd = keyboard(parse, scrollToBottom);
  const clear = () => ($element.value = '');
  const input = ev => {
    // Allow scrolling with arrow keys, page up/down, home/end
    const scrollKeys = [33, 34, 35, 36, 37, 38, 39, 40]; // Page Up, Page Down, End, Home, Arrow keys
    
    if (scrollKeys.includes(ev.keyCode)) {
      // Don't prevent default for scroll keys, let them scroll
      return;
    }
    
    if (busy) {
      ev.preventDefault();
    } else {
      kbd[ev.type](ev);
    }
  };

  // Disable auto-scroll when user manually scrolls away from bottom
  $element.addEventListener('scroll', () => {
    const isAtBottom = $element.scrollTop >= ($element.scrollHeight - $element.clientHeight - 10);
    if (!isAtBottom) {
      autoScrollEnabled = false; // Disable auto-scroll when user scrolls up
    }
  });

  $element.addEventListener('focus', () => setSelectionRange($element));
  $element.addEventListener('blur', focus);
  $element.addEventListener('keypress', input);
  $element.addEventListener('keydown', input);
  window.addEventListener('focus', focus);
  $root.addEventListener('click', focus);
  $root.appendChild($element);

  render();
  output(banner, true);
  focus();

  return {focus, parse, clear, print: output};
};
