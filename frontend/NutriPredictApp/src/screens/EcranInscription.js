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
import {inscription} from '../services/api';

const EcranInscription = ({navigation}) => {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [chargement, setChargement] = useState(false);

  const gererInscription = async () => {
    const nomNettoye = nom.trim();
    const prenomNettoye = prenom.trim();
    const emailNettoye = email.trim().toLowerCase();

    if (
      !nomNettoye ||
      !prenomNettoye ||
      !emailNettoye ||
      !motDePasse ||
      !confirmation
    ) {
      Alert.alert('Champs obligatoires', 'Veuillez remplir tous les champs.');
      return;
    }

    if (motDePasse.length < 8) {
      Alert.alert(
        'Mot de passe trop court',
        'Choisissez un mot de passe d’au moins 8 caractères.',
      );
      return;
    }

    if (motDePasse !== confirmation) {
      Alert.alert(
        'Erreur',
        'Les deux mots de passe ne correspondent pas.',
      );
      return;
    }

    setChargement(true);

    try {
      await inscription({
        nom: nomNettoye,
        prenom: prenomNettoye,
        email: emailNettoye,
        mot_de_passe: motDePasse,
      });

      Alert.alert(
        'Inscription réussie',
        'Votre compte a été créé. Vous pouvez maintenant vous connecter.',
        [
          {
            text: 'Se connecter',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (erreur) {
      const statut = erreur?.response?.status;
      const detail = erreur?.response?.data?.detail;

      let message = 'Impossible de créer le compte. Vérifiez votre connexion et réessayez.';

      if (statut === 409) {
        message = 'Cette adresse email est déjà utilisée.';
      } else if (typeof detail === 'string') {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail.map(item => item.msg).join('\n');
      }

      Alert.alert('Échec de l’inscription', message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <ScrollView
      style={styles.conteneur}
      contentContainerStyle={styles.contenu}>
      <View style={styles.entete}>
        <Text style={styles.titreApp}>NutriPredict</Text>
        <Text style={styles.sousTitre}>
          Créez votre compte pour accéder à votre espace.
        </Text>
      </View>

      <View style={styles.formulaire}>
        <Text style={styles.titreFormulaire}>Créer un compte</Text>

        <Text style={styles.etiquette}>Nom</Text>
        <TextInput
          style={styles.champ}
          placeholder="Votre nom"
          value={nom}
          onChangeText={setNom}
          autoCapitalize="words"
          maxLength={100}
        />

        <Text style={styles.etiquette}>Prénom</Text>
        <TextInput
          style={styles.champ}
          placeholder="Votre prénom"
          value={prenom}
          onChangeText={setPrenom}
          autoCapitalize="words"
          maxLength={100}
        />

        <Text style={styles.etiquette}>Adresse email</Text>
        <TextInput
          style={styles.champ}
          placeholder="votre@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={150}
        />

        <Text style={styles.etiquette}>Mot de passe</Text>
        <TextInput
          style={styles.champ}
          placeholder="8 caractères minimum"
          value={motDePasse}
          onChangeText={setMotDePasse}
          secureTextEntry
          autoCapitalize="none"
        />

        <Text style={styles.etiquette}>Confirmer le mot de passe</Text>
        <TextInput
          style={styles.champ}
          placeholder="Répétez le mot de passe"
          value={confirmation}
          onChangeText={setConfirmation}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.bouton}
          onPress={gererInscription}
          disabled={chargement}>
          {chargement ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.texteBouton}>Créer mon compte</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.boutonSecondaire}
          onPress={() => navigation.goBack()}
          disabled={chargement}>
          <Text style={styles.texteSecondaire}>
            Retour à la connexion
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
  contenu: {
    flexGrow: 1,
  },
  entete: {
    backgroundColor: '#0D7680',
    padding: 25,
    alignItems: 'center',
  },
  titreApp: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sousTitre: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  formulaire: {
    padding: 22,
  },
  titreFormulaire: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#14295A',
    marginBottom: 22,
    textAlign: 'center',
  },
  etiquette: {
    fontSize: 14,
    color: '#14295A',
    fontWeight: 'bold',
    marginBottom: 7,
  },
  champ: {
    borderWidth: 1,
    borderColor: '#D1E8F0',
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    color: '#1A1A2E',
    backgroundColor: '#F7FAFC',
    marginBottom: 15,
  },
  bouton: {
    backgroundColor: '#0D7680',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
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
  texteSecondaire: {
    color: '#0D7680',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default EcranInscription;
