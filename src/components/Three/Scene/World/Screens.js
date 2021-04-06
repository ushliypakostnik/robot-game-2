/* eslint-disable dot-notation,prefer-destructuring */
import * as Three from 'three';

import { DESIGN, OBJECTS } from '@/utils/constants';

import {
  loaderDispatchHelper,
  randomInteger,
  plusOrMinus,
} from '@/utils/utilities';

function Screens() {
  const audioLoader = new Three.AudioLoader();

  this.init = (scope) => {
    const glassTexture = new Three.TextureLoader().load(
      './images/textures/glass.jpg',
      () => {
        scope.render();
        loaderDispatchHelper(scope.$store, 'isGlassLoaded');
      },
    );

    const screensGeometry = new Three.PlaneGeometry(20, 6);
    const screensMaterial = new Three.MeshBasicMaterial({
      color: DESIGN.COLORS.gray,
      map: glassTexture,
    });

    const screen = new Three.Mesh(screensGeometry, screensMaterial);
    let screenClone;

    for (let i = 0; i < OBJECTS.SCREENS[scope.l].data.length; i++) {
      screenClone = screen.clone();

      screenClone.material.map.repeat.set(2, 2);
      screenClone.material.map.wrapS = screenClone.material.map.wrapT = Three.RepeatWrapping;
      screenClone.material.map.encoding = Three.sRGBEncoding;

      screenClone.position.set(
        OBJECTS.SCREENS[scope.l].data[i].x,
        OBJECTS.SCREENS[scope.l].data[i].y,
        OBJECTS.SCREENS[scope.l].data[i].z,
      );
      screenClone.rotateY(OBJECTS.SCREENS[scope.l].data[i].rotate);

      screenClone.name = OBJECTS.SCREENS.name;

      scope.screens.push({
        id: screenClone.id,
        mode: DESIGN.STAFF.mode.idle,
        pseudo: screenClone,
        isOn: true,
        counter: 0,
        isSoundStart: false,
      });

      scope.objects.push(screenClone);
      scope.scene.add(screenClone);
    }

    audioLoader.load('./audio/screens.mp3', (buffer) => {
      scope.audio.addAudioToObjects(scope, scope.screens, buffer, 'pseudo', 'screen', DESIGN.VOLUME.screen, true);
      loaderDispatchHelper(scope.$store, 'isScreensSoundLoaded');
    });

    loaderDispatchHelper(scope.$store, 'isScreensBuild');
  };

  this.animate = (scope) => {
    scope.screens.filter(screen => screen.mode === DESIGN.STAFF.mode.active).forEach((screen) => {
      if (!screen.isSoundStart) {
        screen.isSoundStart = true;
        scope.audio.startObjectSound(screen.id, 'screen');
      }

      scope.decision = randomInteger(1, 5) === 1;
      if (scope.decision && screen.isOn) {
        screen.isOn = false;
        screen.pseudo.material.color = new Three.Color(DESIGN.COLORS.blue);
      } else if (!screen.isOn) {
        ++screen.counter;
        if (screen.counter > 2) {
          scope.decision = plusOrMinus();
          if (scope.decision) {
            screen.isOn = true;
            screen.counter = 0;
            scope.decision = plusOrMinus();
            if (scope.decision) screen.pseudo.material.color = new Three.Color(DESIGN.COLORS.green);
            else screen.pseudo.material.color = new Three.Color(DESIGN.COLORS.white);
          }
        }
      }
    });
  };
}

export default Screens;
