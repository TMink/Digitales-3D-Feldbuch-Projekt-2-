<!--
 * Created Date: 29.11.2023 13:29:27
 * Author: Oliver Mertens
 * 
 * Last Modified: 24.04.2024 21:18:31
 * Modified By: Julian Hardtung
 * 
 * Description: LandingPage as the first entry point for new users
 -->

<template>
    <div id="wrapper">
       <Navigation active_tab_prop="-1" />

        <v-parallax   
            src="assets/background/Background_Landingpage.jpg"
            :height="getParallaxHeight()">

            <div class="d-flex flex-column justify-center align-center text-white">
              <v-card height="35vh"></v-card>
              <v-col>

                <v-img 
                src="assets/logos/3DDF_Icon.png" 
                alt=""
                height="100"
                class="mb-4"/>
                
              </v-col>
                <h1 class="text-h4 font-weight-thin mb-4">
                    {{ toolbar_title }}
                </h1>
                <h3 class="subheading mb-4">
                    {{ $t('lpFieldbookDescriptionShort') }}
                </h3>

                <v-row wrap text-xs-center class="text-center">
                  <v-col>
                    <v-row no-gutters>
                      <v-btn v-on:click="changePage('LoginPage')" color="primary" class="ma-2" 
                        prepend-icon="mdi-login-variant">
                        Login
                      </v-btn>
                      <!--
                      <v-btn 
                        v-on:click="routeRegistration()" 
                        color="secondary" 
                        class="ma-2"
                        prepend-icon="mdi-account-plus-outline">
                        {{ this.$t('registration') }}
                      </v-btn>
                      -->
                      <v-btn 
                        class="ma-2" 
                        color="secondary"
                        prepend-icon="mdi-account-off-outline" 
                        v-on:click="changePage('ActivitiesOverview')">
                        {{ $t('continueWithoutAccount') }}
                    </v-btn>
                    </v-row>

                    <v-card variant="plain" height="10vh"></v-card>
                    <v-icon class="bounce" size="x-large">mdi-arrow-down-circle</v-icon>
                  </v-col>
                </v-row>
            </div>
        </v-parallax>

        <!-- 'What is this?' -->
        <div class="d-flex flex-column justify-center align-center text-center">
          <v-row class="mt-12">
            <v-col cols="3"></v-col>
            <v-col cols="6">
            
            <h1 class="font-weight-thin">{{ $t('lpWhatIsThis') }}</h1>
              <p class="text-h6 mt-4 font-weight-thin">
                {{ $t('lpDescription') }}
              </p>          
            </v-col>
          </v-row>
        </div>

        <div class="d-flex flex-column justify-center align-center mt-6">
          <v-img 
            src="assets/background/hero-image.png" 
            alt=""
            width="1500">
          </v-img>  
        </div>

        <!-- 'How do we document?' -->
        <div class="d-flex flex-column justify-center align-center text-center">
          <v-row class="mt-12">
            <v-col cols="3"></v-col>
            <v-col cols="6">
            
            <h1 class="font-weight-thin">{{ $t('lpHowToDocument') }}</h1>
              <p class="text-h6 mt-4 font-weight-thin">
                {{ $t('lpDescriptionStellenkartensystem') }}
              </p>          
            </v-col>
          </v-row>
        </div>

        <div class="d-flex flex-column justify-center align-center mt-15">
          <v-img 
            src="assets/background/stellenkartensystem.png" 
            alt=""
            width="1000">
          </v-img>  
        </div>

        <div class="d-flex flex-column justify-center align-center text-center">
          <v-row class="">
            <v-col cols="2"></v-col>
            <v-col cols="8"> 
          <v-table class="mt-6">
            <thead>
              <tr>
                <th class="text-left">
                  Index
                </th>
                <th class="text-left">
                  {{ this.$t('title') }}
                </th>
                <th class="text-left">
                  {{ this.$t('description') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="text-left"
                v-for="item in descriptions"
                :key="item.name">
                <td>{{ item.index }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.description }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-col>
          </v-row>
        </div>
             
        <!-- CLIENT DOWNLOAD -->
        <div class="d-flex flex-column justify-center align-center text-center mt-6">
          <v-row class="mt-12">
            <v-col cols="2"></v-col>
            <v-col cols="8">
              <v-card v-if="!isElectron()"  class="pa-4" variant="outlined">
                <v-card-title class="mb-4">
                  <h1 class="font-weight-thin">
                    {{ this.$t('desktopClient') }}
                  </h1>
                </v-card-title>
                <v-card-text>
                  <p class="text-h6 mt-4 font-weight-thin">
                    {{ this.$t('downloadInfoText') }}
                  </p>
                </v-card-text>
                <v-btn href="https://github.com/TMink/Digitales-3D-Feldbuch-Projekt-3-/releases/latest" 
                  color="secondary" 
                  prepend-icon="mdi-download-outline"
                  class="ma-2">{{ this.$t('download') }}</v-btn>
              </v-card>
            </v-col>
          </v-row>
      </div>
      <v-card variant="plain" height="10vh"></v-card>
    </div>
        
</template>
    
<script>
import Navigation from '../components/Navigation.vue'
import { useWindowSize } from 'vue-window-size';

export default {
  name: 'LandingPage',
  components: {
      Navigation
  },
  setup() {
    const { width, height } = useWindowSize();
    return {
      windowWidth: width,
      windowHeight: height,
    };
  },
  data() {
      return {
          toolbar_title: this.$t('fieldbook'),
          descriptions: [
            {
              index: '01',
              name: this.$t('activity') ,
              description: this.$t('lpDescriptionActivity'),
            },
            {
              index: '01',
              name: this.$t('activity_id') ,
              description: this.$t('lpDescriptionActivity_ID'),
            },
            {
              index: '02',
              name: this.$t('place') ,
              description: this.$t('lpDescriptionPlace'),
            },
            {
              index: '02',
              name: this.$t('place_id') ,
              description: this.$t('lpDescriptionPlace_ID')
            },
            {
              index: '03',
              name: this.$t('position') ,
              description: this.$t('lpDescriptionPosition'),
            },
            {
              index: '03',
              name: this.$t('position_id') ,
              description: this.$t('lpDescriptionPosition_ID'),
            },
          ]
      };
  },

  methods: {

    /**
     * Uses the router to change the current page
     * @param {String} pageName 
     */
    changePage(pageName) {
      this.$router.push({ name: pageName });
    },

    /**
     * Checks, if the system is running through electron or not
     */
    isElectron() {
      // Renderer process
      if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
        console.log("renderer true");
        return true;
      }

      // Main process
      if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
        console.log("main process true");
        return true;
      }

      // Detect the user agent when the `nodeIntegration` option is set to true
      if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
        console.log("user agent true");
        return true;
      }

      return false;
    },

    /**
     * Returns ParallaxHeight for different screen sizes
     */
    getParallaxHeight() {
      if (this.windowHeight > 600){
        return this.windowHeight - 103;
      } else {
        return this.windowHeight + 103;
      }
    },
  }
}
</script>
    
<style scoped>
#test {
    text-align: center;
}

.bounce {
  -moz-animation: bounce 2s infinite;
  -webkit-animation: bounce 2s infinite;
  animation: bounce 2s ease-out infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-30px);
  }
  60% {
    transform: translateY(-15px);
  }
  75% {
    opacity: 100%;
  }

  100% {
    opacity: 0%;
  }
}



</style>
    