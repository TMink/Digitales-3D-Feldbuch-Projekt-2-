import "vuetify/styles";
import { createVuetify } from "vuetify";

//TODO: proper color values
export default createVuetify({
  theme: {
    defaultTheme: "fieldbook_dark",
    themes: {
      fieldbook_dark: {
        dark: true,
        colors: {
          background: "#3A3A47",
          opp_background: "#22282C",
          accent: "#3A3A47",                  //navigation-bar
          accent_dark: "#5C4646",             //tob-bar ('digital3d-Fieldbook')
          surface: "#52525E",                 //list-elements
          primary: "#FE9F2E",                 
          secondary: "#B4A27D",
          error: "#f84141",
          info: "#178FFF",
          success: "#16CB49",
          warning: "#FB8C00",
          confirm: "#16CB49",
          decline: "#f84141",
          add:"#9EFFE2",                      //add-buttons
          edit:"#FE9F2E"                      //edit-buttons
        },
      },
      fieldbook_light: {
        dark: false,
        colors: {
          background: "#F6F7FA",
          opp_background: "#444444",
          accent: "#B4A27D",                  //navigation-bar
          accent_dark: "#5C4646",             //tob-bar ('digital3d-Fieldbook')
          surface: "#F2F2F2",                 //list-elements
          primary: "#DA8E60",                 
          secondary: "#594843",
          error: "#B00020",
          info: "#2196F3",
          success: "#4CAF50",
          warning: "#FB8C00",
          confirm: "#1E9E49",
          decline: "#CC453B",
          add: "#7DC8B1",                     //add-buttons
          edit:"#DA8E60"                      //edit-buttons
        },
      },
    },
  },
});
