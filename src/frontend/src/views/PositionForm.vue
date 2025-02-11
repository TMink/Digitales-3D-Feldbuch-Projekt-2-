<!--
 * Created Date: 03.06.2023 10:25:57
 * Author: Julian Hardtung
 * 
 * Last Modified: 14.11.2024 14:52:05
 * Modified By: Julian Hardtung
 * 
 * Description: input page for positions data 
 *              (shows input modules according to module preset)
 -->

<template>
  <Navigation ref="navigationRef" active_tab_prop="2" />
  <v-container fluid>
    <v-row no-gutters>
      <!-- SIDE TABS -->
      <v-col cols="2">
        <v-card style="position:fixed; width:15%;">
          <v-tabs v-model="tab" direction="vertical" color="primary">
            <v-tab value="one" rounded="0">
              {{ $t('general') }}
            </v-tab>
            <v-tab v-if="position.posType == 'drawing'" value="two" rounded="0">
              {{ $tc('drawing', 1) }}
            </v-tab>
            <v-btn rounded="0" color="success" v-on:click="savePosition()">
              {{ $t('save') }}
            </v-btn>
            <v-btn rounded="0" color="primary" v-on:click="goBack">
              {{ $t('cancel') }}
            </v-btn>
            <v-btn rounded="0" color="error" v-on:click="confirmDeletion(position)">
              {{ $t('delete') }}
            </v-btn>
            <ConfirmDialog ref="confirm" />
          </v-tabs>
        </v-card>
      </v-col>

      <v-col cols="10">
        <v-window v-model="tab">
          <!-- CARD 1 ModuleViewer -->
          <v-window-item value="one">
            <ModuleViewer
              :objectProp="position"
              :datingItemsFirstProp="datingsList"
              :titleItemsFirstProp="titlesList"
              :materialItemsFirstProp="materialsList"
              :editorItemsFirstProp="editorsList"
              @dataToPlaceForm="getEmittedData($event)"/>
          </v-window-item>

          <v-window-item value="two">
            <ModuleDrawing
            :objectProp="position"
            @use-drawing="updateDrawingImage"/>
          </v-window-item>

          <v-window-item value="three">
            <ModelForm 
              object_type="Positions" 
              :object_prop="position"/>
          </v-window-item>
        </v-window>
      </v-col>
    </v-row>
  </v-container>
  <v-alert 
    closable 
    type="error" 
    density="compact" 
    variant="outlined" 
    v-model="error_dialog">
    {{ error_message }}
  </v-alert>
</template>
  
<script>
/**
 * Methods overview:
 *  updatePosition  - Updates existing presentation of the position
 *  updateImage     - Updates existing presentation of image
 *  updateText      - Updates existing presentation of text
 *  savePosition    - Saves the current processing status
 *  confirmDeletion - Opens the confirmation dialog
 *  deletePosition  - Deletes the currently selected position
 *  deleteImage     - Deletes an image from the position
 *  addText         - Adds a new text to the list
 *  saveText        - Saves changes to a text of the position
 *  deleteText      - Deletes a text from the position
 *  calcSubNumber   - Calculates the subnumber depending on prev position
 *  goBack          - Goes back to PlaceForm
 */
import { fromOfflineDB } from '../ConnectionToOfflineDB.js';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import ModelForm from '../components/ModelForm.vue';
import ModuleViewer from '../components/ModuleViewer.vue';
import Navigation from '../components/Navigation.vue';
import { toRaw } from 'vue';
import { useRoute } from 'vue-router';
import ModuleDrawing from '../components/modules/ModuleDrawing.vue';
import { reactive } from 'vue';

export default {
  name: 'PositionCreation',

  components: {
    ConfirmDialog,
    ModelForm,
    ModuleViewer,
    Navigation,
    ModuleDrawing
  },

  async setup() {
    var route = useRoute()
    const positionID = route.path.split("/").pop();

    await fromOfflineDB.syncLocalDBs()
      .catch(err => console.error(err));

      
    const position = reactive(await fromOfflineDB
      .getObject(positionID, 'Positions', 'positions')
      .catch(err => console.error(err)));

    const updateDrawingImage = (newData) => {
      Object.assign(position, newData);
    };

    return {
      position,
      updateDrawingImage
    };
  },

  /**
   * Reactive Vue.js data
   */
  data() {
    return {
      materials: [],
      titles: [],
      datings: [],
      error_dialog: false,
      error_message: '',
      tab: null,
      hasUnsavedChanges: false,
      componentHasLoaded: false,

      datingsList: [],
      titlesList: [],
      materialsList: [],
      editorsList: [],
    }
  },
  
  watch: {
    'position': {
      handler: 'handlePositionChange',
      deep: true,
    },
  },

  /**
   * Check if there are unsaved changes to the position 
   * before leaving the PositionForm
   * @param {*} to 
   * @param {*} from 
   * @param {*} next 
   */
  async beforeRouteLeave(to, from, next) {
        var confirmation = false;
        if (this.hasUnsavedChanges) {
          confirmation = await this.confirmRouteChange()
            .catch(err => console.error(err));
          if (confirmation) {
            next();
          }
        } else {
          next();
        }
  },
  /**
   * Initialize data from localDB and .env to the reactive Vue.js data
   */
  async created() {
    this.materials = JSON.parse(import.meta.env.VITE_MATERIALS);
    this.titles = JSON.parse(import.meta.env.VITE_TITLES);
    this.datings = JSON.parse(import.meta.env.VITE_DATINGS);

    await fromOfflineDB.syncLocalDBs()
      .catch(err => console.error(err));
    await this.updatePosition()
      .catch(err => console.error(err));

    const datingFromDB = await fromOfflineDB
      .getAllObjects('AutoFillLists', 'datings')
      .catch(err => console.error(err));

    var customDatings = [];
    datingFromDB.forEach(element => {
      customDatings.push( element.item )
    });

    var lvrDatings = JSON.parse(import.meta.env.VITE_DATINGS);
    this.datingsList = await lvrDatings.concat(customDatings);

    const editorsFromDB = await fromOfflineDB
      .getAllObjects('AutoFillLists', 'editors')
      .catch(err => console.error(err));
    editorsFromDB.forEach(element => {
      this.editorsList.push( element.item )
    });
    
    const materialsFromDB = await fromOfflineDB
      .getAllObjects('AutoFillLists', 'materials')
      .catch(err => console.error(err));
    var customMaterials = [];
    materialsFromDB.forEach(element => {
      customMaterials.push( element.item )
    });
    var lvrMaterials = JSON.parse(import.meta.env.VITE_MATERIALS);
    this.materialsList = await lvrMaterials.concat(customMaterials);

    const titlesFromDB = await fromOfflineDB
      .getAllObjects('AutoFillLists', 'titles')
      .catch(err => console.error(err));
    var customTitles = [];
    titlesFromDB.forEach(element => {
      customTitles.push( element.item )
    });

    var lvrTitles = JSON.parse(import.meta.env.VITE_TITLES);
    this.titlesList = await lvrTitles.concat(customTitles);

    /* const currentPosID = this.$generalStore.getCurrentObject('position');
    this.testPosition = await fromOfflineDB
      .getObject(currentPosID, 'Positions', 'positions')
      .catch(err => console.error(err)); */
    this.componentHasLoaded = true;
  },

  mounted() {
    this.$refs.navigationRef.onViewChange(this.$tc('detailPage', 2, { msg: this.$tc('position', 1)}))
  },

  methods: {
    /**
     * Takes emitted Data from inputModules and assignes 
     * them to the corresponding positionData
     * @param {*} data 
     */
    getEmittedData(data) {
      switch (data[0]) {
        /* Module: Coordinates */
        case 'right':
          this.position.right = data[1];
          break;
        case 'up':
          this.position.up = data[1];
          break;
        case 'depthTop':
          this.position.height = data[1];
          break;
        case 'coordinates':
          this.position.coordinates = data[1];
          break;
        case 'modulePreset.coordinates':
          this.position.modulePreset.coordinates = data[1];
          break;

        /* Module: General */
        case 'editor':
          this.position.editor = data[1];
          break;
        case 'date':
          this.position.date = data[1];
          break;
        case 'title':
          this.position.title = data[1];
          break;
        case 'positionNumber':
          this.position.positionNumber = data[1];
          break;
        case 'hasSubNumber':
          this.position.hasSubNumber = data[1];
          break;
        case 'subNumber':
          this.position.subNumber = data[1];
          break;
        case 'isSeparate':
          this.position.isSeparate = data[1];
          break;

        /* Module: Dating */
        case 'dating':
          this.position.datCode = data[1].datCode
          this.position.dating = data[1].title;
          break;
        case 'modulePreset.dating':
          this.position.modulePreset.dating = data[1];
          break;

        /* Module: Comment */
        case 'comment':
          this.position.comment = data[1];
          break;
        case 'modulePreset.comment':
          this.position.modulePreset.comment = data[1];
          break;

        /* Module: ObjectDescriber */
        case 'material':
          this.position.material = data[1];
          break;
        case 'weight':
          this.position.weight = data[1];
          break;
        case 'count':
          this.position.count = data[1];
          break;
        case 'modulePreset.objectDescribers':
          this.position.modulePreset.objectDescribers = data[1];
          break;

        /* Module: Image */
        case 'image':
          this.position.image = data[1];
          break;

        /* Module: Model */
        case 'model':
          this.position.model = data[1];
          break;

        default:
          console.log( 'Cant specify emitted data: ' + data[0] );
      }

      this.handlePositionChange();
    },
    
    /**
     * Update reactive Vue.js place data
     */
    async updatePosition() {
      /* Get id of selected place */
      const currentPosition = this.$generalStore.getCurrentObject('position');

      /* Get all data of selected place */
      if (this.$route.params.positionID != 'new') {
        const data = await fromOfflineDB
          .getObject(currentPosition, 'Positions', 'positions')
          .catch(err => console.error(err));
        this.position = data;
      }
    },
    
    /**
     * Save a Position to local storage for the current place
     */
    async savePosition() {
      //convert from vue proxy to JSON object
      const rawPosition = toRaw(this.position);
      rawPosition.positionNumber = Number(rawPosition.positionNumber);
      rawPosition.lastChanged = Date.now();
      
      var lastAddedPos = await fromOfflineDB
        .getObjectBefore(rawPosition._id, 'Positions', 'positions')
        .catch(err => console.error(err));
      
      if (rawPosition.hasSubNumber) {
        var newSubNumber = this.calcSubNumber(rawPosition, lastAddedPos);
        rawPosition.subNumber = newSubNumber;
      }
      await fromOfflineDB.updateObject(rawPosition, 'Positions', 'positions')
        .catch(err => console.error(err));
      this.hasUnsavedChanges = false;
      
      this.updateAutoFillList( 'datings', this.position.dating, this.datingsList );
      this.updateAutoFillList( 'titles', this.position.title, this.titlesList );
      this.updateAutoFillList( 'materials', this.position.material, this.materialsList );
      if (this.position.editor != '') {
        this.updateAutoFillList( 'editors', this.position.editor, this.editorsList );
      }
      
      this.$root.vtoast.show({ message: this.$t('saveSuccess')});
    },


    /** 
     * Updates the autofill lists in case a user has entered a new term
     * @param storeName 
     * @param item 
     * @param itemList 
     */
    async updateAutoFillList( storeName, item, itemList) {
      const newEditor = {};

      const editorsFromDB = await fromOfflineDB
        .getAllObjects('AutoFillLists', storeName)
        .catch(err => console.error(err));
      if ( editorsFromDB.length > 0 ) {
        let hasItem = false;
        
        editorsFromDB.forEach( element => {
          if ( element.item == item ) {
            hasItem = true;
          }
        })
        if ( !hasItem && item != '' ) {
          newEditor._id = String(Date.now());
          newEditor.item = toRaw(item);
        }
      } else if ( item != '' ) {
        newEditor._id = String(Date.now());
        newEditor.item = toRaw(item);
      }
      if ( !!Object.keys(newEditor).length ) {
        await fromOfflineDB.addObject(newEditor, 'AutoFillLists', storeName)
          .catch(err => console.error(err));
      }

      if ( itemList.length > 0 ) {
        let notKnown = true;
        itemList.forEach( element => {
          if ( element == item ) {
            notKnown = false;
          }
        })
        if ( notKnown ) {
          itemList.push( item );
        }
      } else {
        if ( item != '' ) {
          itemList.push( item );
        }
      }
    },

    /**
     * Opens the confirmation dialog
     * @param {Object} position
     */
    async confirmDeletion(position) {
      if (
        await this.$refs.confirm.open(
          this.$t('confirm'),
          this.$t('confirm_del', {
            object: this.$tc('position', 1),
            object_nr: position.positionNumber
          })
        )
      ) {
        this.deletePosition();
      }
    },
    
    /**
     * Opens the confirmation dialog for leaving the form
     */
     async confirmRouteChange() {
      if (await this.$refs.confirm.open(this.$t('confirm'),
          this.$t('wantToLeave'))) {
        return true;
      } else {
        return false;
      }
    },
    /**
     * Removes a position from the local storage and the cookies
     */
    async deletePosition() {

      // Remove the positionID from connected place
      const placeID = this.$generalStore.getCurrentObject('place');
      var place = await fromOfflineDB.getObject(placeID, 'Places', 'places')
        .catch(err => console.error(err));
      var rawPosition = toRaw(this.position);
      var index = place.positions.indexOf(rawPosition._id.toString())

      if (index != -1) {
        place.positions.splice(index, 1);
        place.lastChanged = Date.now();
        await fromOfflineDB.updateObject(place, 'Places', 'places')
          .catch(err => console.error(err));
      }
      
      // Delete the position itself
      await fromOfflineDB
        .deleteCascade( rawPosition._id, 'position', 'Positions', 'positions' )
        .catch(err => console.error(err));
      this.$generalStore.removeCurrentObject('position');
      this.hasUnsavedChanges = false;
      this.$router.push({ name: "PositionsOverview" });
    },

    /**
     * Calculates the SubNumber of a position
     */
    calcSubNumber(curPos, prevPos) {
      if (prevPos == undefined) {
        return 1;
      }

      if (prevPos.positionNumber < curPos.positionNumber) {
        return 1;
      }
      
      var subNumber = prevPos.subNumber;

      if (/* curPos.activity == prevPos.activity && */
        curPos.placeID == prevPos.placeID &&
        curPos.positionNumber == prevPos.positionNumber &&
        curPos.right == prevPos.right &&
        curPos.up == prevPos.up &&
        curPos.height == prevPos.height &&
        curPos.dating == prevPos.dating &&
        curPos.title == prevPos.title &&
        curPos.date == prevPos.date &&
        !curPos.isSeparate) {
        return parseInt(subNumber);
      }

      return parseInt(subNumber) + 1;
    },

    /**
     * Cancels the PositionForm and returns to the PlaceForm of current place
     */
    goBack: function () {
      this.$router.push({ name: "PositionsOverview" });
    },

    /**
     * Gets called every time some info of the current position changes.
     * Once a change has happend, the flag `hasUnsavedChanges` gets set to `true`
     */
    handlePositionChange() {
      if (this.hasUnsavedChanges) {
        return
      }

      if (this.componentHasLoaded) {
        this.hasUnsavedChanges = true;
      }
    },

    /**
     * Prevents the input of non numeric values 
     * @param {*} evt 
     */
    filterAllNonNumeric(evt) {
      evt = (evt) ? evt : window.event;
      let expect = evt.target.value.toString() + evt.key.toString();

      if (!/^[0-9]*$/.test(expect)) {
        evt.preventDefault();
      } else {
        return true;
      }
    },

    /**
     * Prevents the input of non numeric values 
     * (allows one single `,` or `.` for float values)
     * @param {*} evt 
     */
    filterNonNumeric(evt) {
      evt = (evt) ? evt : window.event;
      let expect = evt.target.value.toString() + evt.key.toString();

      if (!/^[-+]?[0-9]*[,.]?[0-9]*$/.test(expect)) {
        evt.preventDefault();
      } else {
        return true;
      }
    },
  
  }
};
</script>
  
<style scoped>
</style>
  