/* eslint-disable dot-notation,prefer-destructuring */
import * as Three from 'three';

import { DESIGN, OBJECTS } from '@/utils/constants';

import {
  loaderDispatchHelper,
  distance2D,
} from '@/utils/utilities';

function Atmosphere() {
  const audioLoader = new Three.AudioLoader();

  let sky;

  let isStart = false;
  let moveHiddenStore;
  let x;
  let z;
  let newX;
  let newZ;
  let objects;
  let isBeside = false;
  let isBesideNew;
  let px;
  let pz;

  this.init = (scope) => {
    // Wind
    audioLoader.load('./audio/wind.mp3', (buffer) => {
      scope.audio.addAudioToHero(scope, buffer, 'wind', DESIGN.VOLUME.wind, true);
      loaderDispatchHelper(scope.$store, 'isWindLoaded');
    });


    // Lights

    // Hemisphere
    const light = new Three.HemisphereLight(DESIGN.COLORS.white, DESIGN.COLORS.grayLight2, 0.5);
    light.position.set(0, DESIGN.WORLD_SIZE[scope.l] / 4, 0).normalize();
    scope.scene.add(light);

    // Ambient
    scope.scene.add(new Three.AmbientLight(DESIGN.COLORS.white));


    // Sky
    const skyGeometry = new Three.SphereBufferGeometry(
      DESIGN.WORLD_SIZE[scope.l] * 2.25,
      64,
      64,
    );
    // invert the geometry on the x-axis so that all of the faces point inward
    skyGeometry.scale(-1, 1, 1);

    const skyTexture = new Three.TextureLoader().load('./images/textures/sky.jpg');
    const skyMaterial = new Three.MeshBasicMaterial({ map: skyTexture });
    sky = new Three.Mesh(skyGeometry, skyMaterial);

    sky.rotateX(Math.PI / 4);
    sky.rotateY(Math.PI / 5);
    sky.rotateZ(Math.PI / 4);

    scope.scene.add(sky);

    // Toruch

    scope.toruch = new Three.PointLight(
      DESIGN.COLORS.sun,
      1.5,
      50,
    );
    scope.scene.add(scope.toruch);

    x = scope.camera.position.x;
    z = scope.camera.position.y;
  };

  // Обнаружение врагами
  const checkEnemies = (scope, x, z) => {
    objects = scope.enemies.filter(enemy => enemy.mode !== DESIGN.STAFF.mode.thing);

    isBesideNew = false;
    objects.forEach((enemy) => {
      px = enemy.pseudo.position.x;
      pz = enemy.pseudo.position.z;

      // 50 метров - предупреждении что рядом враги или никого!
      if (distance2D(px, pz, x, z) < DESIGN.CHECK * 5 && !isBesideNew) isBesideNew = true;

      // 40 метров - напуганных врагов попускает
      if (distance2D(px, pz, x, z) > DESIGN.CHECK * 4 && enemy.mode === DESIGN.STAFF.mode.active) {
        enemy.mode = DESIGN.STAFF.mode.idle;
      }

      // 20 метров - если скрытое передвижение, 20 если нет!
      if ((distance2D(px, pz, x, z) < DESIGN.CHECK * 3 && !scope.isHidden && enemy.mode === DESIGN.STAFF.mode.idle)
          || (distance2D(px, pz, x, z) < DESIGN.CHECK * 2 && scope.isHidden && enemy.mode === DESIGN.STAFF.mode.idle)) {
        enemy.mode = DESIGN.STAFF.mode.active;
        scope.events.messagesByIdDispatchHelper(scope, 3, 'discovered', enemy.pseudo.name);
      }
    });

    // Обнаружение панелями
    if (isBeside !== isBesideNew) {
      if (isBesideNew) scope.events.messagesByIdDispatchHelper(scope, 3, 'enemiesBeside');
      else scope.events.messagesByIdDispatchHelper(scope, 3, 'notEnemiesBeside');
      isBeside = isBesideNew;
    }

    scope.screens.forEach((screen) => {
      px = screen.pseudo.position.x;
      pz = screen.pseudo.position.z;

      // 40 метров - панели выключаются
      if (distance2D(px, pz, x, z) > DESIGN.CHECK * 4 && screen.mode === DESIGN.STAFF.mode.active) {
        screen.mode = DESIGN.STAFF.mode.idle;
        screen.isSoundStart = false;
        screen.isOn = true;
        screen.counter = 0;
        screen.pseudo.material.color = new Three.Color(DESIGN.COLORS.gray);
        scope.audio.stopObjectSound(screen.id, 'screen');
      }

      // 20 метров - если скрытое передвижение, 20 если нет!
      if ((distance2D(px, pz, x, z) < DESIGN.CHECK * 3 && !scope.isHidden && screen.mode === DESIGN.STAFF.mode.idle)
        || (distance2D(px, pz, x, z) < DESIGN.CHECK * 2 && scope.isHidden && screen.mode === DESIGN.STAFF.mode.idle)) {
        screen.mode = DESIGN.STAFF.mode.active;
        scope.events.messagesByIdDispatchHelper(scope, 3, 'discovered', screen.pseudo.name);
      }
    });
  };

  this.animate = (scope) => {
    if (!isStart) {
      scope.audio.startHeroSound('wind');

      isStart = true;
    }

    // Проверки привязанные к позиции персонажа в мире
    newX = scope.camera.position.x;
    newZ = scope.camera.position.z;

    if (!isStart) {
      checkEnemies(scope, newX, newZ);
      isStart = true;
    }

    if (Math.abs(x - newX) > DESIGN.CHECK || Math.abs(z - newZ) > DESIGN.CHECK) {
      checkEnemies(scope, newX, newZ);

      x = newX;
      z = newZ;
    }

    if (moveHiddenStore !== scope.isHidden) {
      checkEnemies(scope, newX, newZ);

      moveHiddenStore = scope.isHidden;
      x = newX;
      z = newZ;
    }

    sky.rotateY(scope.delta / 25);
  };
}

export default Atmosphere;
