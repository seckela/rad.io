import { $ } from './dom.js';
import { SCALES } from '../scales.js';

export const getKey = () => +$('key').value;

export const getScale = () => SCALES[$('scale').value];

export const isChill = () => $('style').value === 'chill';

export const isLofi = () => $('style').value === 'lofi';

export const isMetal = () => $('style').value === 'metal';

export const isChip = () => $('style').value === 'chiptune';

export const isAmbient = () => $('style').value === 'ambient';

export const getStyle = () => $('style').value;

export const getOpts = () => ({ mode: $('bgmode').value, delay: +$('delay').value, vary: $('vary').checked, chill: isChill(), lofi: isLofi(), metal: isMetal(), chip: isChip(), ambient: isAmbient(), gap: +$('gap').value });
