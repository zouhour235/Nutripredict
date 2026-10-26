import React, {useState} from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert,
} from 'react-native';

const EcranProfilPatient = ({navigation, route}) => {
  const {destination} = route.params;

  const [sexe, setSexe] = useState('');
  const [age, setAge] = useState('');
  const [poids, setPoids] = useState('');
  const [taille, setTaille] = useState('');
  const [situation, setSituation] = useState('');

  const valider = () => {
    if (!sexe || !age || !poids || !taille) {
      Alert.alert('Informations manquantes',
        'Veuillez remplir tous les champs obligatoires.');
      return;
    }
    navigation.navigate(destination, {
      profil: {sexe, age, poids, taille, situation}
    });
  };

  return (
    <ScrollView style={styles.conteneur}>

      {/* En-tête */}
      <View style={styles.entete}>
        <Text style={styles.titre}>👤 Profil du Patient</Text>
        <Text style={styles.sousTitre}>
          Ces informations permettent un diagnostic personnalisé
        </Text>
      </View>

      {/* Info box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTexte}>
          ℹ️ Les seuils nutritionnels varient selon l'âge,
          le sexe et le poids. Ces informations sont
          indispensables pour un diagnostic précis et fiable.
        </Text>
      </View>

      <View style={styles.formulaire}>

        {/* Sexe */}
        <Text style={styles.etiquette}>Vous êtes * :</Text>
        <View style={styles.rangeBoutons}>
          <TouchableOpacity
            style={[styles.boutonChoix,
              sexe === 'femme' && styles.boutonActif]}
            onPress={() => setSexe('femme')}>
            <Text style={styles.emojicChoix}>👩</Text>
            <Text style={[styles.texteChoix,
              sexe === 'femme' && styles.texteActif]}>
              Femme
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.boutonChoix,
              sexe === 'homme' && styles.boutonActif]}
            onPress={() => setSexe('homme')}>
            <Text style={styles.emojicChoix}>👨</Text>
            <Text style={[styles.texteChoix,
              sexe === 'homme' && styles.texteActif]}>
              Homme
            </Text>
          </TouchableOpacity>
        </View>

        {/* Âge */}
        <Text style={styles.etiquette}>Votre tranche d'âge * :</Text>
        <View style={styles.grilleOptions}>
          {[
            {label: '👶 Moins de 5 ans', val: 'enfant_0_5'},
            {label: '🧒 5 à 14 ans', val: 'enfant_5_14'},
            {label: '🧑 15 à 18 ans', val: 'adolescent'},
            {label: '👤 18 à 30 ans', val: 'jeune_adulte'},
            {label: '👤 30 à 50 ans', val: 'adulte'},
            {label: '👴 Plus de 50 ans', val: 'senior'},
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.boutonOption,
                age === item.val && styles.boutonActif]}
              onPress={() => setAge(item.val)}>
              <Text style={[styles.texteOption,
                age === item.val && styles.texteActif]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Poids */}
        <Text style={styles.etiquette}>Votre poids approximatif * :</Text>
        <View style={styles.grilleOptions}>
          {[
            {label: 'Moins de 10 kg', val: '8'},
            {label: '10 à 25 kg', val: '18'},
            {label: '25 à 50 kg', val: '38'},
            {label: '50 à 70 kg', val: '60'},
            {label: '70 à 90 kg', val: '80'},
            {label: 'Plus de 90 kg', val: '100'},
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.boutonOption,
                poids === item.val && styles.boutonActif]}
              onPress={() => setPoids(item.val)}>
              <Text style={[styles.texteOption,
                poids === item.val && styles.texteActif]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Taille */}
        <Text style={styles.etiquette}>Votre taille approximative * :</Text>
        <View style={styles.grilleOptions}>
          {[
            {label: 'Moins de 100 cm', val: '80'},
            {label: '100 à 140 cm', val: '120'},
            {label: '140 à 155 cm', val: '148'},
            {label: '155 à 165 cm', val: '160'},
            {label: '165 à 175 cm', val: '170'},
            {label: 'Plus de 175 cm', val: '180'},
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.boutonOption,
                taille === item.val && styles.boutonActif]}
              onPress={() => setTaille(item.val)}>
              <Text style={[styles.texteOption,
                taille === item.val && styles.texteActif]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Situation particulière */}
        <Text style={styles.etiquette}>
          Situation particulière (facultatif) :
        </Text>
        <View style={styles.grilleOptions}>
          {[
            {label: '🤰 Enceinte', val: 'enceinte'},
            {label: '🍼 Allaitante', val: 'allaitante'},
            {label: '💊 Sous traitement', val: 'traitement'},
            {label: '✅ Aucune', val: 'aucune'},
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.boutonOption,
                situation === item.val && styles.boutonActif]}
              onPress={() => setSituation(item.val)}>
              <Text style={[styles.texteOption,
                situation === item.val && styles.texteActif]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bouton continuer */}
        <TouchableOpacity
          style={[styles.boutonContinuer,
            (!sexe || !age || !poids || !taille) &&
            styles.boutonDesactive]}
          onPress={valider}>
          <Text style={styles.texteBoutonContinuer}>
            Continuer vers le diagnostic →
          </Text>
        </TouchableOpacity>

        <Text style={styles.noteConfidentialite}>
          🔒 Vos informations sont confidentielles et sécurisées
        </Text>

        <View style={{height: 30}} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  conteneur: {flex: 1, backgroundColor: '#FFFFFF'},
  entete: {backgroundColor: '#0D7680', padding: 20},
  titre: {fontSize: 20, fontWeight: 'bold',
    color: '#FFFFFF', marginBottom: 5},
  sousTitre: {fontSize: 12, color: '#E0F7F8'},
  infoBox: {backgroundColor: '#E8F4F8', margin: 15,
    padding: 14, borderRadius: 10,
    borderLeftWidth: 4, borderLeftColor: '#0D7680'},
  infoTexte: {fontSize: 13, color: '#14295A', lineHeight: 20},
  formulaire: {padding: 15},
  etiquette: {fontSize: 15, fontWeight: 'bold',
    color: '#14295A', marginBottom: 10, marginTop: 15},
  rangeBoutons: {flexDirection: 'row', gap: 12,
    marginBottom: 5},
  boutonChoix: {flex: 1, borderWidth: 2,
    borderColor: '#0D7680', borderRadius: 12,
    padding: 15, alignItems: 'center',
    backgroundColor: '#FFFFFF'},
  boutonActif: {backgroundColor: '#0D7680',
    borderColor: '#0D7680'},
  emojicChoix: {fontSize: 28, marginBottom: 5},
  texteChoix: {fontSize: 14, fontWeight: 'bold',
    color: '#0D7680'},
  texteActif: {color: '#FFFFFF'},
  grilleOptions: {flexDirection: 'row', flexWrap: 'wrap',
    gap: 8, marginBottom: 5},
  boutonOption: {borderWidth: 1, borderColor: '#D1E8F0',
    borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, backgroundColor: '#F7FAFC'},
  texteOption: {fontSize: 13, color: '#14295A'},
  boutonContinuer: {backgroundColor: '#0D7680',
    borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 25, elevation: 3},
  boutonDesactive: {backgroundColor: '#B0C4C8'},
  texteBoutonContinuer: {color: '#FFFFFF', fontSize: 16,
    fontWeight: 'bold'},
  noteConfidentialite: {textAlign: 'center',
    color: '#64748B', fontSize: 12, marginTop: 15},
});

export default EcranProfilPatient;