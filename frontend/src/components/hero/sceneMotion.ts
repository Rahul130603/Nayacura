import type { MutableRefObject } from 'react';

export type SceneMotion = MutableRefObject<{ x: number; y: number; scroll: number }>;

export const floorY = -1.95;
export const cycle = Math.PI * 2;

