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

  createLable( name, distance, position ) {
    const lableDiv = document.createElement( "div" );
    lableDiv.className = "lable";
    lableDiv.innerText = distance
    lableDiv.style.marginTop = "-1em";
    const measurementLable = new CSS2DObject( lableDiv );
    measurementLable.name = name;
    const vec3 = new THREE.Vector3( position.x, position.y, position.z );
    measurementLable.position.copy( vec3 );
    
    return measurementLable
  }

  createBall( name, pos ) {
    const geometry = new THREE.SphereGeometry( 0.03, 6, 4 );
    const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
    const sphere = new THREE.Mesh( geometry, material );
    sphere.name = name;
    return {
      sphere: sphere,
      position: {
        x: pos[0],
        y: pos[1],
        z: pos[2]
      }
    }
  }
  
  createBalls( names, position ) {
    const pos = [ 
      [ position[0], position[1], position[2] ],
      [ position[3], position[4], position[5] ]
    ]
    
    const spheres = []

    names.forEach( (_, i) => {
      spheres.push( this.createBall( names[ i ], pos[ i ] ))
    } )

    return spheres
  }
  
  updateTitle( measureTool ) {
    if ( measureTool.texttoken ) {
      measureTool.title = measureTool.textField;
      measureTool.texttoken = false;
    }
  }

  async saveLineTitle( root, t, measureTool, scene ) {
    let idToBeRenamed = null;
    let token = true;

    const linesInDB = await fromOfflineDB.getAllObjects(
      'Lines', 'lines' );
    
    /* New names cant be blank, undefined or already taken */
    /* Check if new name is " " or undefined */
    if( measureTool.textField == "" || measureTool.textField == undefined ) {
      token = false
      root.vtoast.show({ message: t('Please enter a name first')});
    } else {
      /* Check if the name is already taken */
      var notTaken = true
      linesInDB.forEach( line => {
        if( line.name.split(" -")[0] === measureTool.textField ) {
          notTaken = false;
        }
      } )
      if( !notTaken ) {
        token = false;
        root.vtoast.show({ message: t('Name already taken')});
      }
    }

    /* If the new name meet the criteria from above */
    if( token ) {
      measureTool.infoBlock.forEach( element => {
        if ( element.name === measureTool.title ) {
          element.name = measureTool.textField + " - " + measureTool.title.split("- ")[1];
          idToBeRenamed = element._id;
        }
      } )
  
      /* Rename line in IndexedDb */
      const lineInDB = linesInDB.find( e => e._id === idToBeRenamed );
      lineInDB.name = measureTool.textField + " - " + lineInDB.name.split('- ')[1];
      lineInDB.lable.distance = measureTool.textField + " \n " + lineInDB.name.split('- ')[1];
      await fromOfflineDB.updateObject( lineInDB, 'Lines', 'lines' );

      measureTool.textField = measureTool.textField + " - " + lineInDB.name.split('- ')[1];
  
      this.updateLineMenue( measureTool );
      this.updateLineInnerText( lineInDB.line.name, 
        measureTool.textField.split('- ')[0] + " \n " + lineInDB.name.split('- ')[1], scene );
      measureTool.texttoken = true;
    }
  }

  async deleteLine( placeInDB, measureTool, scene ) {
    let idToBeDeleted = null
    const linesInDB = await fromOfflineDB.getAllObjects(
      'Lines', 'lines' );
      
    measureTool.infoBlock.forEach( element => {
      if ( element.name === measureTool.title ) {
        idToBeDeleted = element._id;
        
        const index = measureTool.infoBlock.indexOf(element)

        /* Delte line from sceneMain */
        const line = scene.getObjectByName(measureTool.infoBlock[index].line)
        const lable = scene.getObjectByName(measureTool.infoBlock[index].lable)
        const firstBall = scene.getObjectByName(measureTool.infoBlock[index].balls[0])
        const secondBall = scene.getObjectByName(measureTool.infoBlock[index].balls[1])

        line.remove( lable );
        line.geometry.dispose();
        line.material.dispose();
        scene.remove( line );

        firstBall.geometry.dispose();
        firstBall.material.dispose();
        scene.remove( firstBall );

        secondBall.geometry.dispose();
        secondBall.material.dispose();
        scene.remove( secondBall );

        /* Delete menue item */
        measureTool.textField = null
        measureTool.infoBlock.splice(index, 1)
      }
    })

    /* Delete from IndexedDb */
    const lineInDB = linesInDB.find( e => e._id === idToBeDeleted );
    const index = placeInDB.lines.indexOf(lineInDB.name);
    placeInDB.lines.splice( index, 1 );
    await fromOfflineDB.deleteObject( lineInDB, 'Lines', 'lines' );
    await fromOfflineDB.updateObject( structuredClone(toRaw(placeInDB)), 
      'Places', 'places' )

    measureTool.title = null;
    this.updateLineMenue( measureTool );
  }

  updateLineMenue( measureTool ) {
    measureTool.allTitles = [];
    measureTool.infoBlock.forEach( element => {
      measureTool.allTitles.push( element.name );
    })
  }

  updateLineInnerText( lineName, newLable, scene ) {
    const lineToChange = scene.getObjectByName( lineName )
    lineToChange.children[0].element.innerText = newLable
  }

  findLineCenter( lineStart, lineEnd ) {
    return { 
      x: (lineEnd.x - lineStart.x) / 2 + lineStart.x, 
      y: (lineEnd.y - lineStart.y) / 2 + lineStart.y,
      z: (lineEnd.z - lineStart.z) / 2 + lineStart.z };
  }
  
}

export class ModelInteraktion {
  
  changeColor( color, modelGroup ) {
    if ( color != null && modelGroup != null ) {

      modelGroup.traverse( (child) => {
        if ( child instanceof THREE.Mesh) {
          child.material.color = new THREE.Color( color );
        }
      })
    }
  }
  
}