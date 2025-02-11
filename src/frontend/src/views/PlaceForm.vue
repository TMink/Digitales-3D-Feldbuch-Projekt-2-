<!--
 * Created Date: 03.06.2023 10:25:57
 * Author: Julian Hardtung
 * 
 * Last Modified: 30.10.2024 17:20:38
 * Modified By: Julian Hardtung
 * 
 * Description: input page for places data 
 *              (shows input modules according to module preset)
 -->

<template>
  <Navigation ref="navigationRef" active_tab_prop="1"/>
  <v-container fluid>
    <v-row no-gutters>
      <v-col cols="2">
        <v-card style="position:fixed; width:15%;">
          <v-tabs v-model="tab" direction="vertical" color="primary">
            <v-tab value="one" rounded="0"> {{ $t('general') }} </v-tab>
            <v-tab value="three" rounded="0"> {{ $t('imageOverview') }} </v-tab>
            <v-btn rounded="0" v-on:click="savePlace()" color="success">
              {{ $t('save') }}
            </v-btn>
            <v-btn rounded="0" v-on:click="cancelPlace" color="primary">
              {{ $t('cancel') }}
            </v-btn>
            <v-btn rounded="0" color="error" v-on:click="confirmDeletion(place)">
              {{ $t('delete') }}
            </v-btn>

            <ConfirmDialog ref="confirm" />

          </v-tabs>
        </v-card>
      </v-col>

      <v-col cols="10">
        <v-window v-model="tab">
          <!-- Tab item 'GENERAL' -->
          <v-window-item value="one">
            <ModuleViewer ref="moduleViewerRef" :datingItemsFirstProp="datingsList" :editorItemsFirstProp="editorsList"
              :titleItemsFirstProp="titlesList" :objectProp="place" @dataToPlaceForm="getEmittedData($event)" />
          </v-window-item>

          <!-- Tab item 'pictures' -->
          <v-window-item value="three">
            <ImageOverview :object_id="place._id" />
          </v-window-item>

        </v-window>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
/**
 * Methods overview:
 *  updatePlace     - Updates existing presentation of the place
 *  savePlace       - Saves the current processing status
 *  confirmDeletion - Opens the confirmation dialog
 *  deletePlace     - Deletes the currently selected place
 *  cancelPlace     - Cancels all not already saved actions
 */
import Navigation from '../components/Navigation.vue';
import ImageOverview from '../components/ImageOverview.vue';
import ModuleViewer from '../components/ModuleViewer.vue';
import ModelForm from '../components/ModelForm.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import { fromOfflineDB } from '../ConnectionToOfflineDB.js';
import { toRaw } from 'vue';
import { useWindowSize } from 'vue-window-size';
import { useRoute } from 'vue-router';

export default {

  name: 'PlaceCreation',
  components: {
    Navigation,
    ConfirmDialog,
    ImageOverview,
    ModuleViewer,
    ModelForm,
  },
  async setup() {
    const { width, height } = useWindowSize();

    var route = useRoute()    
    const placeID = route.path.split("/").pop();

    await fromOfflineDB.syncLocalDBs()
      .catch(err => console.error(err));
    const data = await fromOfflineDB
      .getObject(placeID, 'Places', 'places')
      .catch(err => console.error(err));
      
    return {
      place: data,
      windowWidth: width,
      windowHeight: height,
    };
  },
  /**
   * Reactive Vue.js data
   */
  data() {

    return {
      tab: null,
      backgroundDialog: false,

      headers: [
        {
          title: this.$t('posNumber'),
          align: 'start',
          sortable: true,
          key: 'positionNumber',
        },
        {
          title: this.$t('subNumber'),
          align: 'start',
          sortable: true,
          key: 'subNumber',
        },
        { title: this.$tc('title', 2), align: 'start', key: 'title' },
        { title: this.$t('date'), align: 'start', key: 'date' },
      ],
      searchQuery: '',
      hoveredRow: -1,
      is_required: [v => !!v || 'Pflichtfeld'],
      tickLabels: {
        3: this.$t('veryGood'),
        2: this.$t('good'),
        1: this.$t('moderate'),
        0: this.$t('bad'),
      },
      hasUnsavedChanges: false,
      componentHasLoaded: false,

      datingsList: [],
      editorsList: [],
      titlesList: [],
    }

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
   * Initialize data from localDB to the reactive Vue.js data
   */
  async created() {

    await fromOfflineDB.syncLocalDBs()
      .catch(err => console.error(err));
    await this.updatePlace()
      .catch(err => console.error(err));

    const datingFromDB = await fromOfflineDB
      .getAllObjects('AutoFillLists', 'datings')
      .catch(err => console.error(err));
    
    var customDatings = [];
    datingFromDB.forEach(element => {
      customDatings.push(element.item)
    });

    var lvrDatings = JSON.parse(import.meta.env.VITE_DATINGS)
    this.datingsList = await lvrDatings.concat(customDatings)

    const editorsFromDB = await fromOfflineDB
      .getAllObjects('AutoFillLists', 'editors')
      .catch(err => console.error(err));
    editorsFromDB.forEach(element => {
      this.editorsList.push(element.item)
    });

    const titlesFromDB = await fromOfflineDB
      .getAllObjects('AutoFillLists', 'titles')
      .catch(err => console.error(err));

    var customTitles = [];
    await titlesFromDB.forEach(element => {
      customTitles.push(element.item)
    });

    var lvrTitles = JSON.parse(import.meta.env.VITE_PLACE_TITLES);
    this.titlesList = await lvrTitles.concat(customTitles);

    await this.setAppBarTitle()
      .catch(err => console.error(err));
    this.hideNonTechnicalTabs();
    this.componentHasLoaded = true;
    this.hasUnsavedChanges = false;
  },

  mounted() {
    //this.setAppBarTitle()
    this.$refs.navigationRef.onViewChange(this.$tc('detailPage',1, { msg: this.$tc('place', 2)}))
  },

  watch: {
    'place': {
      handler: 'handlePlaceChange',
      deep: true,
    },
  },

  methods: {
    async getEmittedData(data) {

      switch (data[0]) {
        /* Module: Coordinates */
        case 'right':
          this.place.right = data[1];
          break;
        case 'rightTo':
          this.place.rightTo = data[1];
          break;
        case 'up':
          this.place.up = data[1];
          break;
        case 'upTo':
          this.place.upTo = data[1];
          break;
        case 'depthTop':
          this.place.depthTop = data[1];
          break;
        case 'depthBot':
          this.place.depthBot = data[1];
          break;
        case 'coordinates':
          this.place.coordinates = data[1];
          break;
        case 'modulePreset.coordinates':
          this.place.modulePreset.coordinates = data[1];
          break;

        /* Module: Dating */
        case 'dating':
          this.place.datCode = data[1].datCode;
          this.place.dating = data[1].title;
          break;
        case 'modulePreset.dating':
          this.place.modulePreset.dating = data[1];
          break;

        /* Module: FindTypes */
        case 'noFinding':
          this.place.noFinding = data[1];
          break;
        case 'restFinding':
          this.place.restFinding = data[1];
          break;
        case 'modulePreset.findTypes':
          this.place.modulePreset.findTypes = data[1];
          break;

        /* Module: General */
        case 'editor':
          this.place.editor = data[1];
          break;
        case 'date':
          this.place.date = data[1];
          break;
        case 'title':
          this.place.title = data[1];
          break;

        /* Module: Plane */
        case 'plane':
          this.place.plane = data[1];
          break;
        case 'modulePreset.plane':
          this.place.modulePreset.plane = data[1];
          break;

        /* Module: Profile */
        case 'profile':
          this.place.profile = data[1];
          break;
        case 'modulePreset.profile':
          this.place.modulePreset.profile = data[1];
          break;

        /* Module: Comment */
        case 'comment':
          this.place.comment = data[1];
          break;
        case 'modulePreset.comment':
          this.place.modulePreset.comment = data[1];
          break;

        /* Module: Visibility */
        case 'visibility':
          this.place.visibility = data[1];
          break;
        case 'modulePreset.visibility':
          this.place.modulePreset.visibility = data[1];
          break;

        default:
          console.error('Cant specify emitted data: ' + data[0])
      }

      this.handlePlaceChange();
    },

    /**
     * Update reactive Vue.js place data
     */
    async updatePlace() {
      const currentPlace = this.$generalStore.getCurrentObject('place');
      const data = await fromOfflineDB
        .getObject(currentPlace, 'Places', 'places')
        .catch(err => console.error(err));
      this.place = data;
    },

    /**
     * Save a place to local storage for the current activity
     */
    async savePlace() {
      //convert from vue proxy to JSON object
      const inputPlace = toRaw(this.place);

      //inputPlace.date = new Date().toLocaleDateString("de-DE");
      inputPlace.lastChanged = Date.now();

      await fromOfflineDB.updateObject(inputPlace, 'Places', 'places')
        .catch(err => console.error(err));
      this.hasUnsavedChanges = false;

      this.updateAutoFillList('datings', this.place.dating, this.datingsList);
      this.updateAutoFillList('editors', this.place.editor, this.editorsList);
      this.updateAutoFillList('titles', this.place.title, this.titlesList);

      this.$root.vtoast.show({ message: this.$t('saveSuccess') });
    },

    /**
     * Removes a place from the IndexedDB and the Cookies
     */
     async deletePlace() {

      // Remove the placeID from connected activity
      const acID = this.$generalStore.getCurrentObject('activity');
      var activity = await fromOfflineDB
        .getObject(acID, 'Activities', 'activities')
        .catch(err => console.error(err));
      var index = activity.places.indexOf(this.place._id.toString());

      activity.places.splice(index, 1)
      await fromOfflineDB.updateObject(activity, 'Activities', 'activities')
        .catch(err => console.error(err));

      // Delete the place and all data that is dependent on it
      await fromOfflineDB
        .deleteCascade(this.place._id, 'place', 'Places', 'places')
        .catch(err => console.error(err));
      this.$generalStore.removeCurrentObject('place');
      this.$generalStore.removeCurrentObject('position');

      this.hasUnsavedChanges = false;
      this.$router.push({ name: "PlacesOverview" });
    },

    /**
     * Cancels the PositionForm and returns to the PositionOverview
     */
     cancelPlace() {
      this.$router.push({ name: "PlacesOverview" });
    },

    async updateAutoFillList(storeName, item, itemList) {
      const newEditor = {};

      const editorsFromDB = await fromOfflineDB
        .getAllObjects('AutoFillLists', storeName)
        .catch(err => console.error(err));

      if (editorsFromDB.length > 0) {
        let hasItem = false;

        editorsFromDB.forEach(element => {
          if (element.item == item) {
            hasItem = true;
          }
        })
        if (!hasItem && item != '') {
          newEditor._id = String(Date.now())
          newEditor.item = toRaw(item)
        }
      } else if (item != '') {
        newEditor._id = String(Date.now())
        newEditor.item = toRaw(item)
      }
      if (Object.keys(newEditor).length) {
        await fromOfflineDB.addObject(newEditor, 'AutoFillLists', storeName)
          .catch(err => console.error(err));
      }

      if (itemList.length > 0) {
        let notKnown = true
        itemList.forEach(element => {
          if (element == item) {
            notKnown = false
          }
        })
        if (notKnown) {
          itemList.push(item)
        }
      } else {
        if (item != '') {
          itemList.push(item)
        }
      }
    },

    /**
     * Opens the confirmation dialog for deletion#
     * @param {Object} place 
     */
    async confirmDeletion(place) {
      if (
        await this.$refs.confirm.open(
          this.$t('confirm'),
          this.$t('confirm_del', {
            object: this.$tc('place', 1),
            object_nr: place.placeNumber
          })
        ).catch(err => console.error(err))
      ) {
        this.deletePlace();
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
     * Hide the side tabs that are not required for a technical place
     */
    hideNonTechnicalTabs() {
      if (this.place.placeNumber == 1) {
        // Get all elements with the class "hideable"
        const hideableElements = document.querySelectorAll('.hideable');

        // Hide all hideable elements
        hideableElements.forEach(element => {
          element.style.display = 'none';
        });
      }
    },

    /**
     * Sets the AppBarTitle to the current ActivityNumber + PlaceNumber
     */
    async setAppBarTitle() {
      const acID = this.$generalStore.getCurrentObject('activity');
      var activity = await fromOfflineDB
        .getObject(acID, 'Activities', 'activities')
        .catch(err => console.error(err));

      const plID = this.$generalStore.getCurrentObject('place');
      var place = await fromOfflineDB
        .getObject(plID, 'Places', 'places')
        .catch(err => console.error(err));

      this.$refs.navigationRef.onViewChange(activity.activityNumber + '_' + place.placeNumber)
    },

    /**
     * Gets called every time some info of the current position changes.
     * Once a change has happend, the flag `hasUnsavedChanges` gets set to `true`
     */
    handlePlaceChange() {
      if (this.hasUnsavedChanges) {
        return;
      }

      if (this.componentHasLoaded) {
        this.hasUnsavedChanges = true;
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

<style scoped></style>