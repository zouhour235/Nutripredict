import React, {useState} from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';

const EcranAnalyseImage = ({navigation}) => {
  const [chargement, setChargement] = useState(false);
  const [imageSelectionnee, setImageSelectionnee] = useState(null);

  const conseils = [
    {emoji: '👁️', partie: 'Yeux', conseil: 'Photographiez l\'intérieur de la paupière inférieure — couleur pâle = carence en fer'},
    {emoji: '💅', partie: 'Ongles', conseil: 'Photographiez vos ongles à plat — ongles striés ou concaves = carence en fer/calcium'},
    {emoji: '🫀', partie: 'Peau', conseil: 'Photographiez une zone de peau sèche ou irritée — peau très sèche = carence en vitamine A'},
    {emoji: '💇', partie: 'Cheveux', conseil: 'Photographiez votre cuir chevelu — chute importante = carence en fer/zinc'},
  ];

  const simulerDiagnostic = async () => {
    setChargement(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setChargement(false);

    const resultat = {
      diagnostic: 'Carence en fer',
      probabilite: 78.5,
      niveau_gravite: 'Modérée',
      base_sur: 'analyse d\'image (CNN MobileNetV2)',
      analyses_nutriments: [
        {
          nutriment: 'Fer',
          statut: 'carence',
          icone: '🔴',
          severite: 'Modérée',
          message: 'Signes visuels de carence en fer détectés',
          seuil_normal: '18 - 45 mg/jour',
        },
        {
          nutriment: 'Vitamine A',
          statut: 'normal',
          icone: '🟢',
          severite: 'Normale',
          message: 'Aucun signe visuel de carence en vitamine A',
          seuil_normal: '0.6 - 3.0 mg/jour',
        },
        {
          nutriment: 'Calcium',
          statut: 'normal',
          icone: '🟢',
          severite: 'Normale',
          message: 'Aucun signe visuel de carence en calcium',
          seuil_normal: '1000 - 2500 mg/jour',
        },
      ],
      recommandations: {
        aliments: [
          '🥩 Foie de bœuf ou de mouton — très riche en fer',
          '🥩 Viande rouge locale (bœuf, mouton, chèvre)',
          '🫘 Haricots niébé et lentilles locales',
          '🌿 Feuilles de moringa séchées',
          '🌾 Mil et sorgho (céréales locales du Tchad)',
        ],
        conseils: `🩸 CARENCE EN FER DÉTECTÉE

Votre organisme manque de fer d'après les signes visuels détectés.

🍽️ Alimentation :
- Mangez du foie ou de la viande rouge au moins 3 fois par semaine
- Consommez des haricots niébé ou des lentilles tous les jours
- Ajoutez des feuilles de moringa séchées à vos repas

⛔ À éviter :
- Ne buvez pas de thé ou café pendant les repas

🏥 Consultez un agent de santé pour confirmation.`,
      },
      cas_inattendus: {cas_detectes: 0, alertes: [], conseils_urgents: []},
    };

    navigation.navigate('Resultat', {resultat});
  };

  return (
    <ScrollView style={styles.conteneur}>

      {/* En-tête */}
      <View style={styles.entete}>
        <Text style={styles.titre}>📸 Analyse d'Image</Text>
        <Text style={styles.sousTitre}>
          Photographiez les signes visuels de carence
        </Text>
      </View>

      {/* Info box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTexte}>
          ℹ️ Notre IA analyse les signes visuels de carences
          nutritionnelles sur vos yeux, peau, ongles et cheveux.
          Pas besoin d'examens médicaux !
        </Text>
      </View>

      {/* Conseils photos */}
      <View style={styles.section}>
        <Text style={styles.titreSection}>
          📷 Que photographier ?
        </Text>
        {conseils.map((c, index) => (
          <View key={index} style={styles.carteConseil}>
            <Text style={styles.emojiConseil}>{c.emoji}</Text>
            <View style={styles.contenuConseil}>
              <Text style={styles.titreConseil}>{c.partie}</Text>
              <Text style={styles.texteConseil}>{c.conseil}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Boutons d'action */}
      <View style={styles.section}>
        <Text style={styles.titreSection}>
          Choisissez une option
        </Text>

        {/* Prendre une photo */}
        <TouchableOpacity
          style={styles.boutonPhoto}
          onPress={() => Alert.alert(
            'Appareil photo',
            'Fonctionnalité disponible sur appareil réel avec caméra.'
          )}>
          <Text style={styles.iconeBouton}>📷</Text>
          <Text style={styles.texteBoutonPhoto}>
            Prendre une photo maintenant
          </Text>
        </TouchableOpacity>

        {/* Choisir depuis galerie */}
        <TouchableOpacity
          style={styles.boutonGalerie}
          onPress={() => Alert.alert(
            'Galerie',
            'Fonctionnalité disponible sur appareil réel.'
          )}>
          <Text style={styles.iconeBouton}>🖼️</Text>
          <Text style={styles.texteBoutonGalerie}>
            Choisir depuis la galerie
          </Text>
        </TouchableOpacity>

        {/* Démonstration */}
        <View style={styles.separateur}>
          <View style={styles.ligne} />
          <Text style={styles.texteSeparateur}>OU</Text>
          <View style={styles.ligne} />
        </View>

        <TouchableOpacity
          style={[styles.boutonDemo,
            chargement && styles.boutonDesactive]}
          onPress={simulerDiagnostic}
          disabled={chargement}>
          {chargement ? (
            <View style={styles.ligneChargement}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.texteChargement}>
                Analyse en cours...
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.iconeBouton}>🤖</Text>
              <Text style={styles.texteBoutonDemo}>
                Démonstration CNN MobileNetV2
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.noteDemo}>
          ⚠️ La démonstration simule une analyse CNN.
          Sur un appareil réel, l'IA analysera votre vraie photo.
        </Text>
      </View>

      {/* Maladies détectables */}
      <View style={styles.section}>
        <Text style={styles.titreSection}>
          🔍 Signes détectables par notre IA
        </Text>
        {[
          ['🩸 Pâleur des paupières', 'Carence en fer'],
          ['👁️ Yeux secs/irrités', 'Carence en vitamine A'],
          ['💅 Ongles striés/concaves', 'Carence en fer/calcium'],
          ['🫀 Peau très sèche', 'Carence en vitamine A'],
          ['💇 Chute de cheveux', 'Carence en fer/zinc'],
        ].map(([signe, carence], index) => (
          <View key={index} style={styles.ligneSigne}>
            <Text style={styles.texteSigne}>{signe}</Text>
            <Text style={styles.texteCarence}>→ {carence}</Text>
          </View>
        ))}
      </View>

      <View style={{height: 30}} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  conteneur: {flex: 1, backgroundColor: '#FFFFFF'},
  entete: {backgroundColor: '#F0A500', padding: 20},
  titre: {fontSize: 20, fontWeight: 'bold',
    color: '#FFFFFF', marginBottom: 5},
  sousTitre: {fontSize: 12, color: '#FFF8E1'},
  infoBox: {backgroundColor: '#FFF8E1', margin: 15,
    padding: 14, borderRadius: 10,
    borderLeftWidth: 4, borderLeftColor: '#F0A500'},
  infoTexte: {fontSize: 13, color: '#92400E', lineHeight: 20},
  section: {padding: 20,
    borderBottomWidth: 1, borderBottomColor: '#E8F4F8'},
  titreSection: {fontSize: 16, fontWeight: 'bold',
    color: '#14295A', marginBottom: 15},
  carteConseil: {flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#F7FAFC', borderRadius: 10,
    padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#E8F4F8'},
  emojiConseil: {fontSize: 28, marginRight: 12},
  contenuConseil: {flex: 1},
  titreConseil: {fontSize: 14, fontWeight: 'bold',
    color: '#14295A', marginBottom: 3},
  texteConseil: {fontSize: 12, color: '#64748B', lineHeight: 18},
  boutonPhoto: {backgroundColor: '#0D7680', borderRadius: 12,
    padding: 16, alignItems: 'center',
    marginBottom: 12, flexDirection: 'row',
    justifyContent: 'center', gap: 10, elevation: 3},
  iconeBouton: {fontSize: 22},
  texteBoutonPhoto: {color: '#FFFFFF', fontSize: 15,
    fontWeight: 'bold'},
  boutonGalerie: {borderWidth: 2, borderColor: '#0D7680',
    borderRadius: 12, padding: 14, alignItems: 'center',
    marginBottom: 12, flexDirection: 'row',
    justifyContent: 'center', gap: 10},
  texteBoutonGalerie: {color: '#0D7680', fontSize: 15,
    fontWeight: 'bold'},
  separateur: {flexDirection: 'row', alignItems: 'center',
    marginVertical: 15},
  ligne: {flex: 1, height: 1, backgroundColor: '#D1E8F0'},
  texteSeparateur: {marginHorizontal: 10, color: '#64748B',
    fontWeight: 'bold'},
  boutonDemo: {backgroundColor: '#14295A', borderRadius: 12,
    padding: 16, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center',
    gap: 10, elevation: 3},
  boutonDesactive: {backgroundColor: '#B0C4C8'},
  ligneChargement: {flexDirection: 'row',
    alignItems: 'center', gap: 10},
  texteChargement: {color: '#FFFFFF', fontSize: 15,
    fontWeight: 'bold'},
  texteBoutonDemo: {color: '#FFFFFF', fontSize: 15,
    fontWeight: 'bold'},
  noteDemo: {textAlign: 'center', color: '#64748B',
    fontSize: 11, marginTop: 10, fontStyle: 'italic'},
  ligneSigne: {flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1,
    borderBottomColor: '#E8F4F8'},
  texteSigne: {fontSize: 13, color: '#1A1A2E', flex: 1},
  texteCarence: {fontSize: 12, color: '#0D7680',
    fontWeight: 'bold'},
});

export default EcranAnalyseImage;