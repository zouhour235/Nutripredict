import React, {useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import {diagnosticBiologique} from '../services/api';

const EcranDiagnosticBiologique = ({navigation, route}) => {
  const profil = route.params?.profil || {};
  const [chargement, setChargement] = useState(false);
  const [donnees, setDonnees] = useState({
    wbc: '', lymp: '', neutp: '', lymn: '', neutn: '',
    rbc: '', hgb: '', hct: '', mcv: '', mch: '',
    mchc: '', plt: '', pdw: '', pct: '',
  });

  const mettreAJour = (champ, valeur) => {
    setDonnees({...donnees, [champ]: valeur});
  };

  const valider = () => {
    if (!donnees.hgb || !donnees.rbc || !donnees.mcv) {
      Alert.alert('Erreur',
        'Veuillez remplir au minimum : HGB, RBC et MCV');
      return false;
    }
    return true;
  };

  const lancerDiagnostic = async () => {
    if (!valider()) return;
    setChargement(true);
    try {
      // Distinguer strictement le compte connecté du mode anonyme.
      const mode = await AsyncStorage.getItem('nutripredict_mode');
      const utilisateurId = await AsyncStorage.getItem(
        'nutripredict_utilisateur_id',
      );
      const patientId = await AsyncStorage.getItem(
        'nutripredict_patient_id',
      );

      let identite = {};
      if (mode === 'compte') {
        if (!utilisateurId || !Number.isInteger(Number(utilisateurId))) {
          throw new Error(
            'Identifiant du compte absent. Veuillez vous reconnecter.',
          );
        }
        identite = {utilisateur_id: Number(utilisateurId)};
      } else {
        if (mode !== 'anonyme') {
          await AsyncStorage.setItem('nutripredict_mode', 'anonyme');
        }
        if (patientId && Number.isInteger(Number(patientId))) {
          identite = {patient_id: Number(patientId)};
        }
      }

      const resultat = await diagnosticBiologique({
        ...identite,
        wbc:   parseFloat(donnees.wbc)   || 7.0,
        lymp:  parseFloat(donnees.lymp)  || 35.0,
        neutp: parseFloat(donnees.neutp) || 55.0,
        lymn:  parseFloat(donnees.lymn)  || 2.5,
        neutn: parseFloat(donnees.neutn) || 3.5,
        rbc:   parseFloat(donnees.rbc),
        hgb:   parseFloat(donnees.hgb),
        hct:   parseFloat(donnees.hct)   || 38.0,
        mcv:   parseFloat(donnees.mcv),
        mch:   parseFloat(donnees.mch)   || 28.0,
        mchc:  parseFloat(donnees.mchc)  || 33.0,
        plt:   parseFloat(donnees.plt)   || 250.0,
        pdw:   parseFloat(donnees.pdw)   || 12.0,
        pct:   parseFloat(donnees.pct)   || 0.25,
        sexe: profil.sexe || '',
        situation: profil.situation || '',
        tranche_age: profil.age || '',
      });
      if (mode !== 'compte' && resultat.patient_id != null) {
        await AsyncStorage.setItem(
          'nutripredict_patient_id',
          String(resultat.patient_id),
        );
      }

      if (mode !== 'compte' && resultat.jeton_anonyme) {
        await AsyncStorage.setItem(
          'nutripredict_jeton_anonyme',
          resultat.jeton_anonyme,
        );
      }

      navigation.navigate('Resultat', {resultat});
    } catch (erreur) {
      Alert.alert('Erreur',
        'Impossible de contacter le serveur.');
    } finally {
      setChargement(false);
    }
  };

  const champs = [
    {
      titre: '🩸 Paramètres principaux (obligatoires *)',
      couleur: '#DC2626',
      items: [
        {cle: 'hgb', label: 'Hémoglobine (HGB)',
          unite: 'g/dL', normal: '12-17',
          placeholder: 'Ex: 11.5', obligatoire: true},
        {cle: 'rbc', label: 'Globules rouges (RBC)',
          unite: 'M/µL', normal: '4.2-5.4',
          placeholder: 'Ex: 3.8', obligatoire: true},
        {cle: 'mcv', label: 'Volume Corpusculaire (MCV)',
          unite: 'fL', normal: '80-100',
          placeholder: 'Ex: 75', obligatoire: true},
      ]
    },
    {
      titre: '🔬 Paramètres secondaires (facultatifs)',
      couleur: '#0D7680',
      items: [
        {cle: 'hct', label: 'Hématocrite (HCT)',
          unite: '%', normal: '36-48',
          placeholder: 'Ex: 35'},
        {cle: 'mch', label: 'MCH',
          unite: 'pg', normal: '27-33',
          placeholder: 'Ex: 26'},
        {cle: 'mchc', label: 'MCHC',
          unite: 'g/dL', normal: '32-36',
          placeholder: 'Ex: 31'},
        {cle: 'plt', label: 'Plaquettes (PLT)',
          unite: 'K/µL', normal: '150-400',
          placeholder: 'Ex: 220'},
        {cle: 'wbc', label: 'Globules blancs (WBC)',
          unite: 'K/µL', normal: '4.5-11',
          placeholder: 'Ex: 7.5'},
        {cle: 'lymp', label: 'Lymphocytes (%)',
          unite: '%', normal: '20-40',
          placeholder: 'Ex: 35'},
        {cle: 'neutp', label: 'Neutrophiles (%)',
          unite: '%', normal: '50-70',
          placeholder: 'Ex: 55'},
        {cle: 'lymn', label: 'Lymphocytes (abs)',
          unite: 'K/µL', normal: '1-4',
          placeholder: 'Ex: 2.5'},
        {cle: 'neutn', label: 'Neutrophiles (abs)',
          unite: 'K/µL', normal: '1.8-7',
          placeholder: 'Ex: 4.0'},
        {cle: 'pdw', label: 'PDW',
          unite: 'fL', normal: '10-16',
          placeholder: 'Ex: 12'},
        {cle: 'pct', label: 'PCT',
          unite: '%', normal: '0.1-0.5',
          placeholder: 'Ex: 0.25'},
      ]
    },
  ];

  return (
    <ScrollView style={styles.conteneur}>

      {/* En-tête */}
      <View style={styles.entete}>
        <Text style={styles.titre}>🔬 Diagnostic Biologique</Text>
        <Text style={styles.sousTitre}>
          Entrez vos résultats d'analyses sanguines
        </Text>
      </View>

      {/* Résumé profil patient */}
      <View style={styles.profilBox}>
        <Text style={styles.profilTitre}>👤 Profil du patient</Text>
        <Text style={styles.profilTexte}>
          {profil.sexe === 'femme' ? '👩 Femme' : '👨 Homme'}
          {' • '}
          {profil.age === 'enfant_0_5' ? 'Moins de 5 ans' :
           profil.age === 'enfant_5_14' ? '5 à 14 ans' :
           profil.age === 'adolescent' ? '15 à 18 ans' :
           profil.age === 'jeune_adulte' ? '18 à 30 ans' :
           profil.age === 'adulte' ? '30 à 50 ans' :
           'Plus de 50 ans'}
          {' • '}
          {profil.poids} kg
          {profil.situation && profil.situation !== 'aucune' &&
            ` • ${profil.situation}`}
        </Text>
      </View>

      {/* Info box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTexte}>
          ℹ️ Ces données se trouvent sur votre fiche
          d'analyse sanguine de l'hôpital ou du centre
          de santé. Les champs * sont obligatoires.
        </Text>
      </View>

      {/* Champs */}
      <View style={styles.formulaire}>
        {champs.map((groupe, gi) => (
          <View key={gi}>
            <View style={[styles.titreGroupe,
              {backgroundColor: groupe.couleur}]}>
              <Text style={styles.texteTitreGroupe}>
                {groupe.titre}
              </Text>
            </View>
            {groupe.items.map((champ, ci) => (
              <View key={ci} style={styles.champConteneur}>
                <View style={styles.ligneEtiquette}>
                  <Text style={styles.etiquette}>
                    {champ.label}
                    {champ.obligatoire &&
                      <Text style={styles.obligatoire}> *</Text>}
                  </Text>
                  <Text style={styles.normal}>
                    Normal : {champ.normal} {champ.unite}
                  </Text>
                </View>
                <View style={styles.ligneInput}>
                  <TextInput
                    style={styles.champSaisie}
                    placeholder={champ.placeholder}
                    value={donnees[champ.cle]}
                    onChangeText={v => mettreAJour(champ.cle, v)}
                    keyboardType="numeric"
                  />
                  <Text style={styles.unite}>{champ.unite}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* Bouton diagnostic */}
        <TouchableOpacity
          style={[styles.bouton,
            chargement && styles.boutonDesactive]}
          onPress={lancerDiagnostic}
          disabled={chargement}>
          {chargement ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.texteBouton}>
              🔍 Lancer le diagnostic biologique
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.noteConfidentialite}>
          🔒 Vos données biologiques sont confidentielles
        </Text>

        <View style={{height: 30}} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  conteneur: {flex: 1, backgroundColor: '#FFFFFF'},
  entete: {backgroundColor: '#14295A', padding: 20},
  titre: {fontSize: 20, fontWeight: 'bold',
    color: '#FFFFFF', marginBottom: 5},
  sousTitre: {fontSize: 12, color: '#CADCFC'},
  profilBox: {backgroundColor: '#E8EAF6', margin: 15,
    padding: 12, borderRadius: 10,
    borderLeftWidth: 4, borderLeftColor: '#14295A'},
  profilTitre: {fontSize: 13, fontWeight: 'bold',
    color: '#14295A', marginBottom: 4},
  profilTexte: {fontSize: 13, color: '#14295A'},
  infoBox: {backgroundColor: '#F7FAFC', marginHorizontal: 15,
    marginBottom: 10, padding: 12, borderRadius: 10,
    borderLeftWidth: 4, borderLeftColor: '#0D7680'},
  infoTexte: {fontSize: 12, color: '#14295A', lineHeight: 18},
  formulaire: {padding: 15},
  titreGroupe: {padding: 12, borderRadius: 8, marginBottom: 12},
  texteTitreGroupe: {fontSize: 14, fontWeight: 'bold',
    color: '#FFFFFF'},
  champConteneur: {marginBottom: 14},
  ligneEtiquette: {flexDirection: 'row',
    justifyContent: 'space-between', marginBottom: 5},
  etiquette: {fontSize: 13, fontWeight: 'bold',
    color: '#14295A', flex: 1},
  obligatoire: {color: '#DC2626'},
  normal: {fontSize: 11, color: '#64748B',
    fontStyle: 'italic'},
  ligneInput: {flexDirection: 'row', alignItems: 'center'},
  champSaisie: {flex: 1, borderWidth: 1,
    borderColor: '#D1E8F0', borderRadius: 8,
    padding: 11, fontSize: 15, color: '#1A1A2E',
    backgroundColor: '#F7FAFC'},
  unite: {marginLeft: 8, fontSize: 13,
    color: '#64748B', fontWeight: 'bold', minWidth: 40},
  bouton: {backgroundColor: '#14295A', borderRadius: 12,
    padding: 16, alignItems: 'center',
    marginTop: 20, elevation: 3},
  boutonDesactive: {backgroundColor: '#B0C4C8'},
  texteBouton: {color: '#FFFFFF', fontSize: 16,
    fontWeight: 'bold'},
  noteConfidentialite: {textAlign: 'center',
    color: '#64748B', fontSize: 12, marginTop: 15},
});

export default EcranDiagnosticBiologique;