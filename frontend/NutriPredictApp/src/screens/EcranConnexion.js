import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {connexion} from '../services/api';

const EcranConnexion = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [chargement, setChargement] = useState(false);

  const gererConnexion = async () => {
    if (!email || !motDePasse) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setChargement(true);
    try {
      const resultat = await connexion({
        email,
        mot_de_passe: motDePasse,
      });

      if (resultat.utilisateur_id == null) {
        throw new Error('Identifiant utilisateur absent de la réponse.');
      }
      if (!resultat.access_token) {
        throw new Error('Jeton de connexion absent de la réponse.');
      }

      await AsyncStorage.setItem(
        'nutripredict_access_token',
        resultat.access_token,
      );

      // Enregistrer la session locale du compte connecté.
      await AsyncStorage.setItem(
        'nutripredict_mode',
        'compte',
      );
      await AsyncStorage.setItem(
        'nutripredict_utilisateur_id',
        String(resultat.utilisateur_id),
      );

      Alert.alert('Succès', `Bienvenue ${resultat.prenom} !`);
      navigation.navigate('Accueil');
    } catch (erreur) {
      Alert.alert('Erreur', 'Email ou mot de passe incorrect');
    } finally {
      setChargement(false);
    }
  };

  return (
    <ScrollView style={styles.conteneur}>
      {/* En-tête */}
      <View style={styles.entete}>
        <Text style={styles.titreApp}>NutriPredict</Text>
        <Text style={styles.sousTitre}>🇹🇩 Adapté au contexte tchadien</Text>
      </View>

      {/* Formulaire */}
      <View style={styles.formulaire}>
        <Text style={styles.titreFormulaire}>Connexion</Text>

        <Text style={styles.etiquette}>Adresse email</Text>
        <TextInput
          style={styles.champSaisie}
          placeholder="votre@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.etiquette}>Mot de passe</Text>
        <TextInput
          style={styles.champSaisie}
          placeholder="Votre mot de passe"
          value={motDePasse}
          onChangeText={setMotDePasse}
          secureTextEntry={true}
        />

        <TouchableOpacity
          style={styles.bouton}
          onPress={gererConnexion}
          disabled={chargement}>
          {chargement ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.texteBouton}>Se connecter</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.boutonSecondaire}
          onPress={() => navigation.navigate('Inscription')}>
          <Text style={styles.texteBoutonSecondaire}>
            Pas de compte ? S'inscrire
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.boutonAnonyme}
          onPress={async () => {
            try {
              // Le mode anonyme n'utilise jamais l'identifiant du compte.
              await AsyncStorage.removeItem('nutripredict_utilisateur_id');
              await AsyncStorage.removeItem('nutripredict_access_token');
              await AsyncStorage.setItem('nutripredict_mode', 'anonyme');
              navigation.navigate('Accueil');
            } catch (erreur) {
              Alert.alert(
                'Erreur',
                'Impossible d’activer le mode anonyme sur cet appareil.',
              );
            }
          }}>
          <Text style={styles.texteBoutonAnonyme}>
            Continuer sans compte
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  conteneur: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  entete: {
    backgroundColor: '#0D7680',
    padding: 30,
    alignItems: 'center',
  },
  titreApp: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  sousTitre: {
    fontSize: 13,
    color: '#F0A500',
    fontWeight: 'bold',
  },
  formulaire: {
    padding: 25,
  },
  titreFormulaire: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#14295A',
    marginBottom: 25,
    textAlign: 'center',
  },
  etiquette: {
    fontSize: 14,
    color: '#14295A',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  champSaisie: {
    borderWidth: 1,
    borderColor: '#D1E8F0',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#1A1A2E',
    backgroundColor: '#F7FAFC',
    marginBottom: 18,
  },
  bouton: {
    backgroundColor: '#0D7680',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
  },
  texteBouton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  boutonSecondaire: {
    borderWidth: 1,
    borderColor: '#0D7680',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  texteBoutonSecondaire: {
    color: '#0D7680',
    fontSize: 15,
    fontWeight: 'bold',
  },
  boutonAnonyme: {
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  texteBoutonAnonyme: {
    color: '#64748B',
    fontSize: 14,
  },
});

export default EcranConnexion;