/**
 * Projectile entity: position, velocity, damage.
 */
export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
}

const PROJECTILE_SPEED = 12;
let nextId = 0;

export function nextProjectileId(): number {
  return (nextId += 1);
}

export interface CreateProjectileParams {
  id?: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  damage: number;
}

export function createProjectile(params: CreateProjectileParams): Projectile {
  const { x, y, dx, dy, damage } = params;
  const d = Math.sqrt(dx * dx + dy * dy) || 1;
  return {
    id: params.id ?? nextProjectileId(),
    x,
    y,
    vx: (dx / d) * PROJECTILE_SPEED,
    vy: (dy / d) * PROJECTILE_SPEED,
    damage,
  };
}

export function updatePosition(projectile: Projectile): Projectile {
  return {
    ...projectile,
    x: projectile.x + projectile.vx,
    y: projectile.y + projectile.vy,
  };
}
