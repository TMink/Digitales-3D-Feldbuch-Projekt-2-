/*
 * Created Date: 15.01.2024 11:05:52
 * Author: Tobias Mink
 * 
 * Last Modified: 19.02.2024 17:15:51
 * Modified By: Tobias Mink
 * 
 * Description: 
 */

import * as THREE from 'three';
import { CSS2DObject } from 
  'three/examples/jsm/renderers/CSS2DRenderer'
import { fromOfflineDB } from '../../ConnectionToOfflineDB.js'
import { toRaw } from 'vue';

export class LineTool {
  
  createLine( name, position ) {  
    const points = [];
      points.push( new THREE.Vector3(position[0], position[1], position[2]),
                   new THREE.Vector3(position[3], position[4], position[5]) );

      const geometry = new THREE.BufferGeometry().setFromPoints(
        points
      )

      /* Create line */
      const line = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color: 0x0000ff,
        }),
      )

      line.name = name;
      line.frustumCulled = false;

      return line
  }
}
export class ModelInteraktion {
}