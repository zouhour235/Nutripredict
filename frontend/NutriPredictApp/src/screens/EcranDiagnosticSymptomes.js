import React, {useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, TextInput,
} from 'react-native';
import {diagnosticSymptomes} from '../services/api';
import ChampVocal from '../components/ChampVocal';

const CATEGORIES = [
  {
    titre: '😴 Énergie et vitalité',
    couleur: '#DC2626',
    symptomes: [
      {id: 'fatigue_extreme', texte: 'Je me sens très fatigué(e) même après avoir dormi', carence: 'fer', poids: 4},
      {id: 'essoufflement', texte: 'Je suis essoufflé(e) même pour des efforts légers', carence: 'fer', poids: 3},
      {id: 'faiblesse_generale', texte: 'Je me sens faible et sans force dans le corps', carence: 'fer', poids: 3},
    ]
  },
  {
    titre: '👁️ Yeux et vision',
    couleur: '#7C3AED',
    symptomes: [
      {id: 'vision_nuit', texte: "J'ai du mal à voir la nuit ou dans un endroit sombre", carence: 'vitamine_a', poids: 5},
      {id: 'yeux_secs', texte: 'Mes yeux sont secs, irrités ou qui brûlent souvent', carence: 'vitamine_a', poids: 4},
      {id: 'yeux_paleur', texte: "L'intérieur de mes paupières est très pâle", carence: 'fer', poids: 4},
      {id: 'yeux_jaunes', texte: 'Le blanc de mes yeux est un peu jaune', carence: 'autre', poids: 3},
    ]
  },
  {
    titre: '🫀 Peau et apparence',
    couleur: '#D97706',
    symptomes: [
      {id: 'paleur_visage', texte: 'Mon visage et mes paumes sont très pâles', carence: 'fer', poids: 4},
      {id: 'peau_seche', texte: 'Ma peau est très sèche, rugueuse ou qui se fissure', carence: 'vitamine_a', poids: 3},
      {id: 'plaies_lentes', texte: 'Mes plaies et blessures guérissent très lentement', carence: 'vitamine_a', poids: 3},
      {id: 'peau_boutons', texte: "J'ai des boutons ou éruptions cutanées fréquentes", carence: 'vitamine_a', poids: 2},
    ]
  },
  {
    titre: '💇 Cheveux et ongles',
    couleur: '#0D7680',
    symptomes: [
      {id: 'chute_cheveux', texte: 'Mes cheveux tombent beaucoup ou sont très cassants', carence: 'fer', poids: 3},
      {id: 'ongles_fragiles', texte: 'Mes ongles sont cassants, striés ou concaves', carence: 'fer', poids: 3},
      {id: 'cheveux_secs', texte: 'Mes cheveux sont secs, ternes et sans éclat', carence: 'vitamine_a', poids: 2},
    ]
  },
  {
    titre: '🦴 Os, muscles et dents',
    couleur: '#14295A',
    symptomes: [
      {id: 'crampes', texte: "J'ai des crampes musculaires fréquentes", carence: 'calcium', poids: 4},
      {id: 'douleurs_os', texte: "J'ai des douleurs dans les os ou les articulations", carence: 'calcium', poids: 4},
      {id: 'dents_fragiles', texte: 'Mes dents se cassent facilement', carence: 'calcium', poids: 3},
      {id: 'engourdissements', texte: "J'ai des fourmillements dans les mains ou pieds", carence: 'calcium', poids: 3},
    ]
  },
  {
    titre: '🧠 Concentration et humeur',
    couleur: '#059669',
    symptomes: [
      {id: 'concentration', texte: "J'ai du mal à me concentrer ou me souvenir", carence: 'fer', poids: 2},
      {id: 'maux_tete', texte: "J'ai des maux de tête ou vertiges fréquents", carence: 'fer', poids: 3},
      {id: 'irritabilite', texte: 'Je suis souvent irritable sans raison', carence: 'fer', poids: 2},
    ]
  },
  {
    titre: '🤱 Situation particulière',
    couleur: '#BE185D',
    symptomes: [
      {id: 'enceinte', texte: "Je suis enceinte ou j'allaite un bébé", carence: 'fer', poids: 5},
      {id: 'enfant_croissance', texte: 'Mon enfant grandit moins vite que les autres', carence: 'calcium', poids: 4},
      {id: 'regles_abondantes', texte: "J'ai des règles très abondantes", carence: 'fer', poids: 4},
    ]
  },
];

const EcranDiagnosticSymptomes = ({navigation, route}) => {
  const profil = route.params?.profil || {};
  const [etape, setEtape] = useState(0);
  const [reponses, setReponses] = useState({});
  const [commentaire, setCommentaire] = useState('');
  const [chargement, setChargement] = useState(false);
  const [categorieActive, setCategorieActive] = useState(0);

  const repondre = (symptomeId, reponse) => {
    setReponses(prev => ({...prev, [symptomeId]: reponse}));
  };

  const totalSymptomes = CATEGORIES.reduce(
    (acc, cat) => acc + cat.symptomes.length, 0);
  const totalReponses = Object.keys(reponses).length;

  // Filtrer les catégories selon le sexe
  const categoriesFiltrees = CATEGORIES.filter(cat => {
    if (cat.titre.includes('Situation particulière') &&
        profil.sexe === 'homme') {
      return false; // Cacher pour les hommes
    }
    return true;
  });

  const lancerDiagnostic = async () => {
    if (totalReponses < Math.floor(totalSymptomes * 0.5)) {
      Alert.alert('Attention',
        `Veuillez répondre à plus de questions.\n\nRépondues : ${totalReponses}/${totalSymptomes}`);
      return;
    }
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

      const ageValue =
        profil.age === 'enfant_0_5' ? 3 :
        profil.age === 'enfant_5_14' ? 10 :
        profil.age === 'adolescent' ? 16 :
        profil.age === 'jeune_adulte' ? 22 :
        profil.age === 'adulte' ? 38 : 58;

      const sexeCode = profil.sexe === 'femme' ? 0 : 1;

      const resultat = await diagnosticSymptomes({
        ...identite,
        age: ageValue,
        taille_cm: parseFloat(profil.taille) || 165,
        poids_kg: parseFloat(profil.poids) || 65,
        apport_calorique: 2000,
        apport_vitamine_a: 0.7,
        apport_fer: 10,
        apport_calcium: 1000,
        sexe_code: sexeCode,
        activite_code: 1,
        symptomes: reponses,
        tranche_age: profil.age || 'adulte',
        commentaire_libre: commentaire,
        sexe: profil.sexe || '',
        situation: profil.situation || '',
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
      console.error('[NutriPredict] Erreur diagnostic symptômes :', {
        message: erreur?.message,
        code: erreur?.code,
        statutHTTP: erreur?.response?.status,
        donneesServeur: erreur?.response?.data,
      });

      const statut = erreur?.response?.status;
      const detail = erreur?.response?.data?.detail;

      let message;
      if (statut) {
        message = `Erreur HTTP ${statut}.`;
        if (detail) {
          message += '\\n' + (
            typeof detail === 'string'
              ? detail
              : JSON.stringify(detail)
          );
        }
      } else {
        message = erreur?.message || 'Erreur inconnue.';
      }

      Alert.alert('Erreur du diagnostic', message);
    } finally {
      setChargement(false);
    }
  };

  // ── ÉTAPE 0 : Résumé profil
  if (etape === 0) {
    return (
      <ScrollView style={styles.conteneur}>
        <View style={styles.entete}>
          <Text style={styles.titre}>🩺 Diagnostic par Symptômes</Text>
          <Text style={styles.sousTitre}>
            Gratuit et adapté aux zones rurales du Tchad 🇹🇩
          </Text>
        </View>

        {/* Résumé profil */}
        <View style={styles.profilBox}>
          <Text style={styles.profilTitre}>👤 Votre profil</Text>
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
            {profil.poids === '8' ? 'Moins de 10 kg' :
            profil.poids === '18' ? '10 à 25 kg' :
            profil.poids === '38' ? '25 à 50 kg' :
            profil.poids === '60' ? '50 à 70 kg' :
            profil.poids === '80' ? '70 à 90 kg' :
            'Plus de 90 kg'}
            {profil.situation && profil.situation !== 'aucune' &&
              ` • ${profil.situation}`}
          </Text>
        </View>

        <View style={styles.formulaire}>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTexte}>
              ℹ️ Vous n'avez pas besoin d'examens médicaux.
              Répondez simplement aux questions sur ce que
              vous voyez et ressentez.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.boutonSuivant}
            onPress={() => setEtape(1)}>
            <Text style={styles.texteBoutonSuivant}>
              Commencer le diagnostic →
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ── ÉTAPE 1 : Symptômes par catégorie
  const categorie = categoriesFiltrees[categorieActive];
  const estDerniereCat =
    categorieActive === categoriesFiltrees.length - 1;

  return (
    <View style={styles.conteneur}>
      {/* Barre de progression */}
      <View style={styles.barreProgression}>
        <View style={[styles.progressionRemplie,
          {width: `${(totalReponses / totalSymptomes) * 100}%`}]}
        />
      </View>
      <Text style={styles.texteProgression}>
        {totalReponses}/{totalSymptomes} questions répondues
      </Text>

      {/* Onglets */}
      <ScrollView horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.onglets}>
        {categoriesFiltrees.map((cat, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.onglet,
              categorieActive === index && {
                borderBottomColor: cat.couleur,
                borderBottomWidth: 3,
              }]}
            onPress={() => setCategorieActive(index)}>
            <Text style={styles.texteOnglet}>
              {cat.titre.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.contenuCategorie}>
        {/* Titre catégorie */}
        <View style={[styles.titreCategorie,
          {backgroundColor: categorie.couleur}]}>
          <Text style={styles.texteTitreCategorie}>
            {categorie.titre}
          </Text>
        </View>

        {/* Questions */}
        {categorie.symptomes.map(symptome => (
          <View key={symptome.id} style={styles.carteQuestion}>
            <Text style={styles.texteQuestion}>
              {symptome.texte}
            </Text>
            <View style={styles.rangeBoutonsReponse}>
              <TouchableOpacity
                style={[styles.boutonOui,
                  reponses[symptome.id] === 'oui' &&
                  styles.boutonOuiActif]}
                onPress={() => repondre(symptome.id, 'oui')}>
                <Text style={[styles.texteReponse,
                  reponses[symptome.id] === 'oui' &&
                  styles.texteActif]}>✓ OUI</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.boutonNon,
                  reponses[symptome.id] === 'non' &&
                  styles.boutonNonActif]}
                onPress={() => repondre(symptome.id, 'non')}>
                <Text style={[styles.texteReponse,
                  reponses[symptome.id] === 'non' &&
                  styles.texteActif]}>✗ NON</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Commentaire libre sur dernière catégorie */}
        {estDerniereCat && (
          <View style={styles.sectionCommentaire}>
            <Text style={styles.etiquetteCommentaire}>
              💬 Avez-vous autre chose à signaler ?
            </Text>
            <ChampVocal
             valeur={commentaire}
             onChangement={setCommentaire}
             placeholder="Décrivez vos symptômes... ou appuyez sur 🎤 pour parler"
             nombreLignes={3}
           />
          </View>
        )}

        {/* Navigation */}
        <View style={styles.navigationCat}>
          {categorieActive > 0 && (
            <TouchableOpacity
              style={styles.boutonPrecedent}
              onPress={() => setCategorieActive(
                categorieActive - 1)}>
              <Text style={styles.texteBoutonNav}>
                ← Précédent
              </Text>
            </TouchableOpacity>
          )}
          {!estDerniereCat ? (
            <TouchableOpacity
              style={styles.boutonSuivantCat}
              onPress={() => setCategorieActive(
                categorieActive + 1)}>
              <Text style={styles.texteActif}>Suivant →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.boutonDiagnostic,
                chargement && styles.boutonDesactive]}
              onPress={lancerDiagnostic}
              disabled={chargement}>
              {chargement ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.texteBoutonDiagnostic}>
                  🔍 Obtenir mon diagnostic
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.boutonRetour}
          onPress={() => setEtape(0)}>
          <Text style={styles.texteBoutonRetour}>← Retour</Text>
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  conteneur: {flex: 1, backgroundColor: '#FFFFFF'},
  entete: {backgroundColor: '#0D7680', padding: 20},
  titre: {fontSize: 20, fontWeight: 'bold',
    color: '#FFFFFF', marginBottom: 5},
  sousTitre: {fontSize: 12, color: '#E0F7F8'},
  profilBox: {backgroundColor: '#E8F4F8', margin: 15,
    padding: 12, borderRadius: 10,
    borderLeftWidth: 4, borderLeftColor: '#0D7680'},
  profilTitre: {fontSize: 13, fontWeight: 'bold',
    color: '#14295A', marginBottom: 4},
  profilTexte: {fontSize: 13, color: '#14295A'},
  formulaire: {padding: 20},
  infoBox: {backgroundColor: '#F7FAFC', borderRadius: 10,
    padding: 15, marginBottom: 20,
    borderLeftWidth: 4, borderLeftColor: '#0D7680'},
  infoBoxTexte: {fontSize: 13, color: '#14295A',
    lineHeight: 20},
  boutonSuivant: {backgroundColor: '#0D7680',
    borderRadius: 12, padding: 16,
    alignItems: 'center', elevation: 3},
  texteBoutonSuivant: {color: '#FFFFFF', fontSize: 16,
    fontWeight: 'bold'},
  boutonDesactive: {backgroundColor: '#B0C4C8'},
  barreProgression: {height: 6, backgroundColor: '#E8F4F8'},
  progressionRemplie: {height: 6, backgroundColor: '#0D7680'},
  texteProgression: {textAlign: 'center', fontSize: 12,
    color: '#0D7680', padding: 5, fontWeight: 'bold'},
  onglets: {borderBottomWidth: 1,
    borderBottomColor: '#E8F4F8', maxHeight: 50},
  onglet: {paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent'},
  texteOnglet: {fontSize: 18},
  contenuCategorie: {flex: 1},
  titreCategorie: {padding: 15, marginBottom: 10},
  texteTitreCategorie: {fontSize: 16, fontWeight: 'bold',
    color: '#FFFFFF'},
  carteQuestion: {backgroundColor: '#F7FAFC',
    borderRadius: 12, padding: 15,
    marginHorizontal: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#E8F4F8', elevation: 1},
  texteQuestion: {fontSize: 14, color: '#14295A',
    lineHeight: 21, marginBottom: 12, fontWeight: '500'},
  rangeBoutonsReponse: {flexDirection: 'row', gap: 10},
  boutonOui: {flex: 1, borderWidth: 2,
    borderColor: '#16A34A', borderRadius: 8,
    padding: 10, alignItems: 'center'},
  boutonOuiActif: {backgroundColor: '#16A34A'},
  boutonNon: {flex: 1, borderWidth: 2,
    borderColor: '#DC2626', borderRadius: 8,
    padding: 10, alignItems: 'center'},
  boutonNonActif: {backgroundColor: '#DC2626'},
  texteReponse: {fontWeight: 'bold', fontSize: 14,
    color: '#14295A'},
  texteActif: {color: '#FFFFFF', fontWeight: 'bold'},
  sectionCommentaire: {margin: 12, marginTop: 5},
  etiquetteCommentaire: {fontSize: 14, fontWeight: 'bold',
    color: '#14295A', marginBottom: 8},
  champCommentaire: {borderWidth: 1,
    borderColor: '#D1E8F0', borderRadius: 10,
    padding: 13, fontSize: 14, color: '#1A1A2E',
    backgroundColor: '#F7FAFC', minHeight: 80,
    textAlignVertical: 'top'},
  navigationCat: {flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15, gap: 10},
  boutonPrecedent: {flex: 1, borderWidth: 1,
    borderColor: '#0D7680', borderRadius: 10,
    padding: 12, alignItems: 'center'},
  texteBoutonNav: {color: '#0D7680', fontWeight: 'bold'},
  boutonSuivantCat: {flex: 1, backgroundColor: '#0D7680',
    borderRadius: 10, padding: 12, alignItems: 'center'},
  boutonDiagnostic: {flex: 1, backgroundColor: '#14295A',
    borderRadius: 10, padding: 12, alignItems: 'center'},
  texteBoutonDiagnostic: {color: '#FFFFFF',
    fontWeight: 'bold', fontSize: 14},
  boutonRetour: {padding: 12, alignItems: 'center'},
  texteBoutonRetour: {color: '#64748B', fontSize: 13},
});

export default EcranDiagnosticSymptomes;