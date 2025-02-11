/*
 * Created Date: 15.01.2024 11:05:52
 * Author: Tobias Mink
 * 
 * Last Modified: 15.04.2024 20:14:42
 * Modified By: Tobias Mink
 * 
 * Description: A collection of all created tools. The initialisation of each 
 *              tool takes place in Initialisations.js.
 *              These classes contain the logic behind each tool and can be 
 *              imported inside 3DView.js for further usage.
 */

import { Vector3, LineBasicMaterial, Line, BufferGeometry, SphereGeometry, 
  MeshBasicMaterial, Mesh, BoxGeometry, Color, BufferAttribute } from "three";
import { CSS2DObject } from 
  'three/examples/jsm/renderers/CSS2DRenderer'
import { toRaw } from 'vue';
import { Brush } from 'three-bvh-csg';

export class MeasurementTool {

  constructor( interfaceToOfflineDB ) {
    this.indexedDB = interfaceToOfflineDB;
  }
  
  createLine( name, position, mmTool ) {  
    const points = [];
      points.push( new Vector3(position[0], position[1], position[2]),
                   new Vector3(position[3], position[4], position[5]) );

      const geometry = new BufferGeometry().setFromPoints(
        points
      )

      /* Create line */
      const line = new Line(
        geometry,
        new LineBasicMaterial({
          color: mmTool.lineParams.color,
        }),
      )

      line.name = name;
      line.frustumCulled = mmTool.lineParams.frustrumCulled;

      return line
  }

  createLable( name, distance, position, mmTool ) {
    const lableDiv = document.createElement( mmTool.measurementLableParams.element );
    lableDiv.className = mmTool.measurementLableParams.className;
    lableDiv.innerText = distance
    lableDiv.style.marginTop = mmTool.measurementLableParams.marginTop;
    const measurementLable = new CSS2DObject( lableDiv );
    measurementLable.name = name;
    const vec3 = new Vector3( position.x, position.y, position.z );
    measurementLable.position.copy( vec3 );
    
    return measurementLable
  }

  createBall( name, pos, mmTool ) {
    const geometry = new SphereGeometry( mmTool.ballParams.size.x, mmTool.ballParams.size.y, mmTool.ballParams.size.z );
    const material = new MeshBasicMaterial( { color: mmTool.ballParams.color } );
    const sphere = new Mesh( geometry, material );
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
  
  createBalls( names, position, mmTool ) {
    const pos = [ 
      [ position[0], position[1], position[2] ],
      [ position[3], position[4], position[5] ]
    ]
    
    const spheres = []

    names.forEach( (_, i) => {
      spheres.push( this.createBall( names[ i ], pos[ i ], mmTool ))
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

    const linesInDB = await this.indexedDB.get( 'allObjects', undefined, 
      'Lines', 'lines' );
    
    /* New names cant be blank, undefined or already taken */
    /* Check if new name is " " or undefined */
    if( measureTool.textField == "" || measureTool.textField == undefined ) {
      token = false
      root.vtoast.show({ message: t( alertParams.noName )});
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
        root.vtoast.show({ message: t( alertParams.dupName )});
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
      lineInDB.lable.distance = 
        measureTool.textField + " \n " + lineInDB.name.split('- ')[1];
      await this.indexedDB.update( 'object', lineInDB, 'Lines', 'lines' );

      measureTool.textField = 
        measureTool.textField + " - " + lineInDB.name.split('- ')[1];
  
      this.updateLineMenue( measureTool );
      this.updateLineInnerText( lineInDB.line.name, 
        measureTool.textField.split('- ')[0] + " \n " + lineInDB.name.split('- ')[1], scene );
      measureTool.texttoken = true;
    }
  }

  async deleteLine( placeInDB, measureTool, scene ) {
    let idToBeDeleted = null
    const linesInDB = await this.indexedDB.get( 'allObjects', undefined, 'Lines', 
      'lines' );
      
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
    await this.indexedDB.delete( 'object', lineInDB, 'Lines', 'lines' );
    await this.indexedDB.update( 'object', structuredClone(toRaw(placeInDB)), 
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

export class AnnotationTool {

  constructor( interfaceToOfflineDB ) {
    this.indexedDB = interfaceToOfflineDB
  }
  
  /**
   * Creates a new label as an 2D-Sprite. This lable can be added to any
   * Object3D.
   * @param { String } name 
   * @param { String } annotationName 
   * @param { object } position 
   * @returns CSS2DObject
   */
  createLable( name, annotationName, position, anTool ) {
    /* Create new div-container element for CSS2D-Object */
    const lableDiv = document.createElement( anTool.lableParams.element );
    
    /* Adapt div-container parameters */
    lableDiv.className = anTool.lableParams.className;
    lableDiv.innerText = annotationName
    lableDiv.style.marginTop = anTool.lableParams.marginTop;

    /* Create new CSS2D-Object inside the div-container */
    const measurementLable = new CSS2DObject( lableDiv );

    /* Adapt CSS2D-Object parameters */
    measurementLable.name = name;
    
    /* Create new vector */
    const vec3 = new Vector3( position[0], position[1], position[2] );
    
    /* Change position of CSS2D-Object in relation to the new vector */
    measurementLable.position.copy( vec3 );
    
    /* Return the CSS2D-Object */
    return measurementLable
  }

  /**
   * Creates a Mesh based on the BoxGeometry.
   * @param { String } name
   * @returns 
   */
  createBox( name, anTool ) {
    /* Create geometry */
    const geometry = new BoxGeometry( anTool.boxParams.size.x, 
      anTool.boxParams.size.y, anTool.boxParams.size.z );
      
    /* Create material */
    const material = new MeshBasicMaterial( { 
      color: anTool.boxParams.color } );

    /* Create mesh from geometry and material */
    const box = new Mesh( geometry, material );
    
    /* Change name of the object */
    box.name = name;
    
    /* Return object */
    return box; 
  }

  /**
   * Updates UI to match the new textfield input.
   * @param { object } annotatTool 
   */
  updateTitle( annotatTool ) {
    if ( annotatTool.texttoken ) {
      /* Overrides the given title with the string inside the textfield. */
      annotatTool.title = annotatTool.textField;
      annotatTool.texttoken = false;
    }
  }

  /**
   * Updates the text of an annotation and updateds the ui and IndexedDB.
   * @param { any } root 
   * @param { any } t 
   * @param { object } annotatTool 
   * @param { Scene } scene 
   */
  async saveAnnotationTitle( root, t, annotatTool, scene ) {
    let idToBeRenamed = null;
    let token = true;

    /* Get all annotations in IndexedDB */
    const annotationsInDB = await this.indexedDB.get( 'allObjects', undefined,
      'Annotations', 'annotations' );
    
    /* New names cant be blank, undefined or already taken */
    /* Check if new name is " " or undefined */
    if( annotatTool.textField == "" || annotatTool.textField == undefined ) {
      token = false
      /* Alert the user if no name in entered */
      root.vtoast.show({ message: t('Please enter a name first')});
    } else {
      /* Check if the name is already taken */
      var notTaken = true
      annotationsInDB.forEach( annotation => {
        if( annotation.lableName === annotatTool.textField ) {
          notTaken = false;
        }
      } )
      if( !notTaken ) {
        token = false;
        /* Alert the user if the name is already taken */
        root.vtoast.show({ message: t('Name already taken')});
      }
    }

    /* If the new name meet the criteria from above, adapt the new name */
    if( token ) {
      annotatTool.infoBlock.forEach( element => {
        if ( element.lableName === annotatTool.title ) {
          element.lableName = annotatTool.textField;
          idToBeRenamed = element._id;
        }
      } )
  
      /* Find the annotation with the id that matches the one that will be 
       * changed. */
      const annotationInDB = annotationsInDB.find( 
        e => e._id === idToBeRenamed );
      /* Rename line */
      annotationInDB.lableName = annotatTool.textField;
      /* Update the entry in IndexedDB */
      await this.indexedDB.update( 'object', annotationInDB, 'Annotations', 
        'annotations' );
  
      /* Update the drop down menue */
      this.updateAnnotationMenue( annotatTool );
      /* Update the text of the CSS2D-Object */
      this.updateAnnotationInnerText( annotationInDB.boxName, 
        annotatTool.textField, scene );
      annotatTool.texttoken = true;
    }
  }

  /**
   * Updates all entrys of the drop down menue.
   * @param { object } annotatTool 
   */
  updateAnnotationMenue( annotatTool ) {
    annotatTool.allTitles = [];
    annotatTool.infoBlock.forEach( element => {
      annotatTool.allTitles.push( element.lableName );
    })
  }

  /**
   * Updates the text of an annotation in scene
   * @param { String } boxName 
   * @param { String } newLable 
   * @param { Scene } scene 
   */
  updateAnnotationInnerText( boxName, newLable, scene ) {
    const boxToChange = scene.getObjectByName( boxName )
    boxToChange.children[0].element.innerText = newLable
  }

  /**
   * Search through all annotations, locate the one wich should be removed and
   * remove it from scene, ui and IndexedDB.
   * @param { any } placeInDB 
   * @param { object } annotatTool 
   * @param { scene } scene 
   */
  async deleteAnnotation( placeInDB, annotatTool, scene ) {
    let idToBeDeleted = null

    /* Get all annotations in IndexedDB */
    const annotationsInDB = await this.indexedDB.get( 'allObjects', undefined,
      'Annotations', 'annotations' );
    
    /* Disposes the geoemetry and material of the box, removes the CSS2D-Object
     * and clears the ui entrys. */
    annotatTool.infoBlock.forEach( element => {
      if ( element.lableName === annotatTool.title ) {
        idToBeDeleted = element._id;
        
        const index = annotatTool.infoBlock.indexOf(element)

        /* Get the CSS2D- and box-Object from scene */
        const lable = scene.getObjectByName(annotatTool.infoBlock[index]._id)
        const box = scene.getObjectByName(annotatTool.infoBlock[index].boxName)

        /* Remove attached CSS2D-Object and dispose geometry and material of the 
         * box object. Afterwards remove it from scene. */
        box.remove( lable );
        box.geometry.dispose();
        box.material.dispose();
        scene.remove( box );

        /* Remove the CSS2D-Object */
        lable.remove()

        /* Delete menue item */
        annotatTool.textField = null
        annotatTool.infoBlock.splice(index, 1)
      }
    })

    /* Find annotation with id that matches the one that will be 
     * changed. */
    const annotationInDB = annotationsInDB.find( e => e._id === idToBeDeleted );
    /* Remove annotation-id from list of the current place */
    const index = placeInDB.lines.indexOf(annotationInDB._id);
    placeInDB.annotations.splice( index, 1 );
    /* Remove annotation from IndexedDB */
    await this.indexedDB.delete( 'object', annotationInDB, 'Annotations', 
      'annotations' );
    /* Update place entry in IndexedDB */
    await this.indexedDB.update( 'object', structuredClone(toRaw(placeInDB)), 
      'Places', 'places' )

    /* Remove title from ui */
    annotatTool.title = null;
    /* Update menue content */
    this.updateAnnotationMenue( annotatTool );
  }
}

export class ModelInteraktion {
  
  /**
   * Updates the color of an object
   * @param { String } color 
   * @param { Group } modelGroup 
   */
  changeColor( color, modelGroup ) {
    if ( color != null && modelGroup != null ) {

      modelGroup.traverse( (child) => {
        if ( child instanceof Mesh) {
          child.material.color = new Color( color );
        }
      })
    }
  }
  
}

export class SegmentationTool {

  /**
   * Updates the position and color attributes of a brush.
   * @param { Brush } brush 
   * @param { object } params 
   */
  updateBrush( brush, main ) {

    /* Dispose currently used geometry and return a non-index version of an 
     * indexed BufferGeometry. */
    brush.geometry.dispose();
    brush.geometry = brush.geometry.toNonIndexed();
  
    /* Update position */
    const position = brush.geometry.attributes.position;
    const array = new Float32Array( position.count * 3 );
    for ( let i = 0, l = array.length; i < l; i += 9 ) {

      array[ i + 0 ] = 1;
      array[ i + 1 ] = 0;
      array[ i + 2 ] = 0;
  
      array[ i + 3 ] = 0;
      array[ i + 4 ] = 1;
      array[ i + 5 ] = 0;
  
      array[ i + 6 ] = 0;
      array[ i + 7 ] = 0;
      array[ i + 8 ] = 1;
  
    }
  
    /* Set new color attribute */
    brush.geometry.setAttribute( 'color', new BufferAttribute( array, 3 ) );
    brush.prepareGeometry();
    main.needsUpdate = true;
  }

  /**
   * Make all objects in scene invisible and all brushes visible and vice 
   * versa.
   * @param { object } stTool 
   * @param { object } main 
   */
  async switchToSegmentationMode( stTool, env_withAllObjects ) {   
    if( !stTool.brushToCutWith.brush.visible ) {
      env_withAllObjects.objects.allObjects[0].children[0].visible = false;
      stTool.brushToCutWith.brush.visible = true;
      stTool.brushesOfObjects.forEach( ( brush ) => {
        brush.brush.visible = true;
        brush.resultObject.visible = true;
      } )
    } else {
      stTool.brushToCutWith.brush.visible = false;
      stTool.brushesOfObjects.forEach( ( brush ) => {
        brush.brush.visible = false;
        brush.resultObject.visible = false;
      } )
      env_withAllObjects.objects.allObjects[0].children[0].visible = true;
    }
    
    /**
     * Attach transform controls to brush, to be able to move it.
     * Detach if they are already attached.
     */
    if( !stTool.brushToCutWith.attach ) {
      env_withAllObjects.components.controls[1].data.attach( stTool.brushToCutWith.brush );
      stTool.brushToCutWith.attach = true;
    } else {
      env_withAllObjects.components.controls[1].data.transformControls.detach();
      stTool.brushToCutWith.attach = false;
    }

    env_withAllObjects.components.attributes.list.needsUpdate = true;
  }

  /**
   * Show controls or hide them
   * @param { object } main 
   */
  displayControls( main ) {
    if( main.transformControls.visible ) {
      main.transformControls.visible = false;
    } else {
      main.transformControls.visible = true;
    }
  }

}