import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';

const EcranAccueil = ({navigation}) => {
  return (
    <ScrollView style={styles.conteneur}>

      {/* En-tête */}
      <View style={styles.entete}>
        <Text style={styles.titreApp}>NutriPredict</Text>
        <Text style={styles.sousTitre}>
          Diagnostic Prédictif des Carences Nutritionnelles
        </Text>
        <Text style={styles.contexteTchad}>
          🇹🇩 Adapté au contexte tchadien
        </Text>
      </View>

      {/* Modes de diagnostic */}
      <View style={styles.section}>
        <Text style={styles.titreSection}>
          Choisissez votre mode de diagnostic
        </Text>

        {/* Diagnostic Symptômes */}
        <TouchableOpacity
          style={[styles.carte, styles.carteSymptomes]}
          onPress={() => navigation.navigate('ProfilPatient', {destination: 'DiagnosticSymptomes'})}>
          <Text style={styles.icone}>🩺</Text>
          <View style={styles.contenuCarte}>
            <Text style={styles.titreCarte}>
              Diagnostic par Symptômes
            </Text>
            <Text style={styles.descriptionCarte}>
              Répondez aux questions sur vos symptômes visibles
            </Text>
          </View>
          <Text style={styles.fleche}>›</Text>
        </TouchableOpacity>

        {/* Diagnostic Biologique */}
        <TouchableOpacity
          style={[styles.carte, styles.carteBiologique]}
          onPress={() => navigation.navigate('ProfilPatient', {destination: 'DiagnosticBiologique'})}>
          <Text style={styles.icone}>🔬</Text>
          <View style={styles.contenuCarte}>
            <Text style={styles.titreCarte}>
              Diagnostic Biologique
            </Text>
            <Text style={styles.descriptionCarte}>
              Entrez vos résultats d'analyses biologiques
            </Text>
          </View>
          <Text style={styles.fleche}>›</Text>
        </TouchableOpacity>

        {/* Analyse Image */}
        <TouchableOpacity
          style={[styles.carte, styles.carteImage]}
          onPress={() => navigation.navigate('ProfilPatient', {destination: 'AnalyseImage'})}>
          <Text style={styles.icone}>📸</Text>
          <View style={styles.contenuCarte}>
            <Text style={styles.titreCarte}>
              Analyse d'Image
            </Text>
            <Text style={styles.descriptionCarte}>
              Photographiez peau, yeux ou ongles pour analyse
            </Text>
          </View>
          <Text style={styles.fleche}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Boutons rapides */}
      <View style={styles.section}>
        <View style={styles.rangeBoutons}>
          <TouchableOpacity
            style={styles.boutonRapide}
            onPress={() => navigation.navigate('Historique')}>
            <Text style={styles.iconeBoutonRapide}>📋</Text>
            <Text style={styles.texteBoutonRapide}>
              Mes Diagnostics
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.boutonRapide}
            onPress={() => navigation.navigate('CentresSante')}>
            <Text style={styles.iconeBoutonRapide}>🏥</Text>
            <Text style={styles.texteBoutonRapide}>
              Centres de Santé
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Carences fréquentes au Tchad */}
      <View style={styles.section}>
        <Text style={styles.titreSection}>
          Carences fréquentes au Tchad
        </Text>
        <View style={styles.grilleCarences}>
          {[
            {nom: 'Fer', emoji: '🩸', couleur: '#FFE5E5'},
            {nom: 'Vitamine A', emoji: '👁️', couleur: '#FFF3E0'},
            {nom: 'Iode', emoji: '🦋', couleur: '#E8F5E9'},
            {nom: 'Zinc', emoji: '💪', couleur: '#E3F2FD'},
            {nom: 'Calcium', emoji: '🦴', couleur: '#F3E5F5'},
            {nom: 'Vitamine D', emoji: '☀️', couleur: '#FFFDE7'},
          ].map((carence, index) => (
            <View key={index} style={[styles.carteCarence,
              {backgroundColor: carence.couleur}]}>
              <Text style={styles.emojiCarence}>{carence.emoji}</Text>
              <Text style={styles.nomCarence}>{carence.nom}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Info Tchad */}
      <View style={styles.infoTchad}>
        <Text style={styles.titreInfoTchad}>
          🇹🇩 Contexte nutritionnel au Tchad
        </Text>
        <Text style={styles.texteInfoTchad}>
          Selon l'enquête SMART 2024, plus de 30% des enfants
          tchadiens souffrent de carences nutritionnelles.
          NutriPredict aide à détecter ces carences rapidement
          et gratuitement.
        </Text>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  conteneur: {flex: 1, backgroundColor: '#FFFFFF'},
  entete: {backgroundColor: '#0D7680', padding: 25,
    alignItems: 'center'},
  titreApp: {fontSize: 28, fontWeight: 'bold',
    color: '#FFFFFF', marginBottom: 5},
  sousTitre: {fontSize: 13, color: '#E0F7F8',
    textAlign: 'center', marginBottom: 5},
  contexteTchad: {fontSize: 13, color: '#F0A500',
    fontWeight: 'bold'},
  section: {padding: 20},
  titreSection: {fontSize: 18, fontWeight: 'bold',
    color: '#14295A', marginBottom: 15},
  carte: {flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1, shadowRadius: 4},
  carteSymptomes: {backgroundColor: '#E8F4F8',
    borderLeftWidth: 4, borderLeftColor: '#0D7680'},
  carteBiologique: {backgroundColor: '#E8EAF6',
    borderLeftWidth: 4, borderLeftColor: '#14295A'},
  carteImage: {backgroundColor: '#FFF8E1',
    borderLeftWidth: 4, borderLeftColor: '#F0A500'},
  icone: {fontSize: 28, marginRight: 12},
  contenuCarte: {flex: 1},
  titreCarte: {fontSize: 15, fontWeight: 'bold',
    color: '#14295A', marginBottom: 3},
  descriptionCarte: {fontSize: 12, color: '#64748B',
    lineHeight: 18},
  fleche: {fontSize: 24, color: '#0D7680',
    fontWeight: 'bold'},
  rangeBoutons: {flexDirection: 'row', gap: 12},
  boutonRapide: {flex: 1, backgroundColor: '#F7FAFC',
    borderRadius: 12, padding: 15, alignItems: 'center',
    borderWidth: 1, borderColor: '#D1E8F0', elevation: 1},
  iconeBoutonRapide: {fontSize: 28, marginBottom: 5},
  texteBoutonRapide: {fontSize: 12, fontWeight: 'bold',
    color: '#14295A', textAlign: 'center'},
  grilleCarences: {flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between'},
  carteCarence: {width: '30%', borderRadius: 10,
    padding: 12, alignItems: 'center',
    marginBottom: 10, elevation: 2},
  emojiCarence: {fontSize: 24, marginBottom: 5},
  nomCarence: {fontSize: 11, fontWeight: 'bold',
    color: '#14295A', textAlign: 'center'},
  infoTchad: {margin: 20, padding: 18,
    backgroundColor: '#E8F4F8', borderRadius: 12,
    borderLeftWidth: 4, borderLeftColor: '#0D7680',
    marginBottom: 30},
  titreInfoTchad: {fontSize: 15, fontWeight: 'bold',
    color: '#14295A', marginBottom: 8},
  texteInfoTchad: {fontSize: 13, color: '#1A1A2E',
    lineHeight: 20},
});

export default EcranAccueil;