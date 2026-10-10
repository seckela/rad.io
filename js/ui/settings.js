import { $ } from './dom.js';
import { SCALES } from '../scales.js';

export const getKey = () => +$('key').value;

export const getScale = () => SCALES[$('scale').value];

export const isChill = () => $('style').value === 'chill';

export const isMetal = () => $('style').value === 'metal';

export const getOpts = () => ({ mode: $('bgmode').value, delay: +$('delay').value, vary: $('vary').checked, chill: isChill(), metal: isMetal(), gap: +$('gap').value });
