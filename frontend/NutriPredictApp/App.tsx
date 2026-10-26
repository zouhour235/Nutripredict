import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import EcranConnexion from './src/screens/EcranConnexion';
import EcranInscription from './src/screens/EcranInscription';
import EcranAccueil from './src/screens/EcranAccueil';
import EcranProfilPatient from './src/screens/EcranProfilPatient';
import EcranDiagnosticSymptomes from './src/screens/EcranDiagnosticSymptomes';
import EcranDiagnosticBiologique from './src/screens/EcranDiagnosticBiologique';
import EcranAnalyseImage from './src/screens/EcranAnalyseImage';
import EcranResultat from './src/screens/EcranResultat';
import EcranHistorique from './src/screens/EcranHistorique';
import EcranCentresSante from './src/screens/EcranCentresSante';

const Pile = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Pile.Navigator
        initialRouteName="Connexion"
        screenOptions={{
          headerStyle: {backgroundColor: '#0D7680'},
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}>

        <Pile.Screen
          name="Connexion"
          component={EcranConnexion}
          options={{headerShown: false}}
        />
        <Pile.Screen
          name="Inscription"
          component={EcranInscription}
          options={{title: 'Créer un compte'}}
        />
        <Pile.Screen
          name="Accueil"
          component={EcranAccueil}
          options={{title: 'NutriPredict 🇹🇩', headerLeft: null}}
        />
        <Pile.Screen
          name="ProfilPatient"
          component={EcranProfilPatient}
          options={{title: 'Informations du Patient'}}
        />
        <Pile.Screen
          name="DiagnosticSymptomes"
          component={EcranDiagnosticSymptomes}
          options={{title: 'Diagnostic par Symptômes'}}
        />
        <Pile.Screen
          name="DiagnosticBiologique"
          component={EcranDiagnosticBiologique}
          options={{title: 'Diagnostic Biologique'}}
        />
        <Pile.Screen
          name="AnalyseImage"
          component={EcranAnalyseImage}
          options={{title: "Analyse d'Image"}}
        />
        <Pile.Screen
          name="Resultat"
          component={EcranResultat}
          options={{title: 'Résultat du Diagnostic'}}
        />
        <Pile.Screen
          name="Historique"
          component={EcranHistorique}
          options={{title: 'Mes Diagnostics'}}
        />
        <Pile.Screen
          name="CentresSante"
          component={EcranCentresSante}
          options={{title: 'Centres de Santé au Tchad 🇹🇩'}}
        />

      </Pile.Navigator>
    </NavigationContainer>
  );
};

export default App;