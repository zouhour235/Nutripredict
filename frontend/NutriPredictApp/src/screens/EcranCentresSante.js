import React, {useState} from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput,
} from 'react-native';

// ============================================================
// DONNÉES CENTRES DE SANTÉ AU TCHAD
// ============================================================

const CENTRES_SANTE = {
  "N'Djaména": [
    {
      nom: "Hôpital Général de Référence Nationale (HGRN)",
      type: "Hôpital national",
      adresse: "Avenue Charles de Gaulle, N'Djaména",
      telephone: "+235 22 51 44 42",
      services: ["Nutrition", "Pédiatrie", "Médecine interne"],
      nutritionniste: true,
      urgences: true,
      emoji: "🏥",
    },
    {
      nom: "Hôpital de la Liberté",
      type: "Hôpital public",
      adresse: "Quartier Liberté, N'Djaména",
      telephone: "+235 22 51 38 60",
      services: ["Nutrition", "Pédiatrie", "Maternité"],
      nutritionniste: true,
      urgences: true,
      emoji: "🏥",
    },
    {
      nom: "Hôpital d'Abena",
      type: "Hôpital public",
      adresse: "Quartier Abena, N'Djaména",
      telephone: "+235 22 51 27 15",
      services: ["Médecine générale", "Pédiatrie"],
      nutritionniste: false,
      urgences: true,
      emoji: "🏥",
    },
    {
      nom: "Centre de Santé de Bololo",
      type: "Centre de santé",
      adresse: "Quartier Bololo, N'Djaména",
      telephone: "+235 66 25 18 90",
      services: ["Nutrition", "Vaccination", "Maternité"],
      nutritionniste: true,
      urgences: false,
      emoji: "🏪",
    },
    {
      nom: "Clinique Al-Mouna",
      type: "Clinique privée",
      adresse: "Quartier Klemat, N'Djaména",
      telephone: "+235 22 51 42 36",
      services: ["Nutrition", "Analyses biologiques", "Pédiatrie"],
      nutritionniste: true,
      urgences: true,
      emoji: "🏨",
    },
    {
      nom: "Centre Nutrition Thérapeutique (CNT)",
      type: "Centre spécialisé nutrition",
      adresse: "N'Djaména",
      telephone: "+235 22 52 11 30",
      services: ["Malnutrition aiguë", "Plumpy'Nut", "Suivi nutritionnel"],
      nutritionniste: true,
      urgences: false,
      emoji: "🌿",
    },
  ],
  "Moundou": [
    {
      nom: "Hôpital Régional de Moundou",
      type: "Hôpital régional",
      adresse: "Centre ville, Moundou",
      telephone: "+235 22 69 12 45",
      services: ["Nutrition", "Pédiatrie", "Médecine interne"],
      nutritionniste: true,
      urgences: true,
      emoji: "🏥",
    },
    {
      nom: "Centre de Santé de Moundou",
      type: "Centre de santé",
      adresse: "Quartier Nord, Moundou",
      telephone: "+235 66 30 45 20",
      services: ["Soins primaires", "Vaccination", "Nutrition"],
      nutritionniste: false,
      urgences: false,
      emoji: "🏪",
    },
  ],
  "Sarh": [
    {
      nom: "Hôpital Régional de Sarh",
      type: "Hôpital régional",
      adresse: "Centre ville, Sarh",
      telephone: "+235 22 62 11 23",
      services: ["Nutrition", "Pédiatrie", "Maternité"],
      nutritionniste: true,
      urgences: true,
      emoji: "🏥",
    },
    {
      nom: "Centre de Santé Communautaire de Sarh",
      type: "Centre communautaire",
      adresse: "Quartier Sud, Sarh",
      telephone: "+235 66 41 28 75",
      services: ["Soins primaires", "Nutrition", "Vaccination"],
      nutritionniste: false,
      urgences: false,
      emoji: "🏪",
    },
  ],
  "Abéché": [
    {
      nom: "Hôpital Régional d'Abéché",
      type: "Hôpital régional",
      adresse: "Centre ville, Abéché",
      telephone: "+235 22 69 81 14",
      services: ["Nutrition", "Pédiatrie", "Médecine interne"],
      nutritionniste: true,
      urgences: true,
      emoji: "🏥",
    },
    {
      nom: "Centre Nutrition MSF Abéché",
      type: "Centre nutrition ONG",
      adresse: "Abéché",
      telephone: "+235 66 52 33 10",
      services: ["Malnutrition aiguë", "Urgences nutritionnelles"],
      nutritionniste: true,
      urgences: true,
      emoji: "🌍",
    },
  ],
  "Doba": [
    {
      nom: "Hôpital de Doba",
      type: "Hôpital public",
      adresse: "Centre ville, Doba",
      telephone: "+235 22 68 15 30",
      services: ["Médecine générale", "Pédiatrie", "Maternité"],
      nutritionniste: false,
      urgences: true,
      emoji: "🏥",
    },
  ],
  "Bongor": [
    {
      nom: "Hôpital de Bongor",
      type: "Hôpital public",
      adresse: "Centre ville, Bongor",
      telephone: "+235 22 67 20 11",
      services: ["Médecine générale", "Nutrition", "Pédiatrie"],
      nutritionniste: true,
      urgences: true,
      emoji: "🏥",
    },
  ],
  "Mongo": [
    {
      nom: "Hôpital Régional de Mongo",
      type: "Hôpital régional",
      adresse: "Centre ville, Mongo",
      telephone: "+235 22 63 10 45",
      services: ["Médecine générale", "Pédiatrie"],
      nutritionniste: false,
      urgences: true,
      emoji: "🏥",
    },
  ],
  "Am Timan": [
    {
      nom: "Hôpital de Am Timan",
      type: "Hôpital public",
      adresse: "Centre ville, Am Timan",
      telephone: "+235 66 44 12 88",
      services: ["Médecine générale", "Nutrition", "Urgences"],
      nutritionniste: true,
      urgences: true,
      emoji: "🏥",
    },
  ],
};

const EcranCentresSante = ({navigation}) => {
  const [villeSelectionnee, setVilleSelectionnee] = useState("N'Djaména");
  const [recherche, setRecherche] = useState('');
  const [filtreNutrition, setFiltreNutrition] = useState(false);

  const villes = Object.keys(CENTRES_SANTE);

  const centresFiltres = CENTRES_SANTE[villeSelectionnee]?.filter(
    centre => {
      const matchRecherche = centre.nom.toLowerCase().includes(
        recherche.toLowerCase()) ||
        centre.type.toLowerCase().includes(recherche.toLowerCase());
      const matchNutrition = filtreNutrition ?
        centre.nutritionniste : true;
      return matchRecherche && matchNutrition;
    }
  ) || [];

  const totalNutritionnistes = CENTRES_SANTE[villeSelectionnee]
    ?.filter(c => c.nutritionniste).length || 0;

  return (
    <ScrollView style={styles.conteneur}>

      {/* En-tête */}
      <View style={styles.entete}>
        <Text style={styles.titre}>
          🏥 Centres de Santé au Tchad
        </Text>
        <Text style={styles.sousTitre}>
          Trouvez un centre de santé près de chez vous
        </Text>
      </View>

      {/* Info box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTexte}>
          ℹ️ En cas de carence sévère, consultez
          immédiatement le centre de santé le plus proche.
          Les soins nutritionnels sont GRATUITS au Tchad
          dans les centres publics.
        </Text>
      </View>

      {/* Recherche */}
      <View style={styles.sectionRecherche}>
        <TextInput
          style={styles.champRecherche}
          placeholder="🔍 Rechercher un centre..."
          value={recherche}
          onChangeText={setRecherche}
        />
        <TouchableOpacity
          style={[styles.boutonFiltre,
            filtreNutrition && styles.boutonFiltreActif]}
          onPress={() => setFiltreNutrition(!filtreNutrition)}>
          <Text style={[styles.texteFiltre,
            filtreNutrition && styles.texteFiltreActif]}>
            🌿 Nutritionniste
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sélection ville */}
      <View style={styles.sectionVilles}>
        <Text style={styles.titreSection}>
          🗺️ Choisissez votre ville
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {villes.map((ville, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.boutonVille,
                villeSelectionnee === ville &&
                styles.boutonVilleActif]}
              onPress={() => setVilleSelectionnee(ville)}>
              <Text style={[styles.texteVille,
                villeSelectionnee === ville &&
                styles.texteVilleActif]}>
                {ville}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats ville */}
      <View style={styles.statsVille}>
        <Text style={styles.texteStats}>
          📍 {villeSelectionnee} —
          {' '}{CENTRES_SANTE[villeSelectionnee]?.length || 0} centres
          dont {totalNutritionnistes} avec nutritionniste
        </Text>
      </View>

      {/* Liste centres */}
      <View style={styles.section}>
        {centresFiltres.length === 0 ? (
          <View style={styles.videConteneur}>
            <Text style={styles.texteVide}>
              Aucun centre trouvé
            </Text>
          </View>
        ) : (
          centresFiltres.map((centre, index) => (
            <View key={index} style={styles.carteCentre}>

              {/* En-tête centre */}
              <View style={styles.enteteCentre}>
                <Text style={styles.emojicCentre}>
                  {centre.emoji}
                </Text>
                <View style={styles.infoCentre}>
                  <Text style={styles.nomCentre}>
                    {centre.nom}
                  </Text>
                  <Text style={styles.typeCentre}>
                    {centre.type}
                  </Text>
                </View>
              </View>

              {/* Badges */}
              <View style={styles.ligneBadges}>
                {centre.nutritionniste && (
                  <View style={styles.badgeNutrition}>
                    <Text style={styles.texteBadge}>
                      🌿 Nutritionniste
                    </Text>
                  </View>
                )}
                {centre.urgences && (
                  <View style={styles.badgeUrgence}>
                    <Text style={styles.texteBadge}>
                      🚨 Urgences
                    </Text>
                  </View>
                )}
              </View>

              {/* Adresse */}
              <View style={styles.ligneInfo}>
                <Text style={styles.iconeInfo}>📍</Text>
                <Text style={styles.texteInfo}>
                  {centre.adresse}
                </Text>
              </View>

              {/* Téléphone */}
              <View style={styles.ligneInfo}>
                <Text style={styles.iconeInfo}>📞</Text>
                <Text style={[styles.texteInfo,
                  styles.telephone]}>
                  {centre.telephone}
                </Text>
              </View>

              {/* Services */}
              <View style={styles.ligneServices}>
                <Text style={styles.titreServices}>
                  Services :
                </Text>
                <Text style={styles.texteServices}>
                  {centre.services.join(' • ')}
                </Text>
              </View>

            </View>
          ))
        )}
      </View>

      {/* Note importante */}
      <View style={styles.noteImportante}>
        <Text style={styles.titreNote}>
          ⚠️ En cas d'urgence nutritionnelle
        </Text>
        <Text style={styles.texteNote}>
          • Malnutrition aiguë sévère → HGRN N'Djaména
          {'\n'}• Test MUAC gratuit dans tous les centres
          {'\n'}• Plumpy'Nut disponible gratuitement
          {'\n'}• UNICEF Tchad : +235 22 51 86 60
          {'\n'}• MSF Tchad : +235 22 51 77 28
        </Text>
      </View>

      <View style={{height: 30}} />
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
  sectionRecherche: {paddingHorizontal: 15,
    paddingBottom: 10, gap: 10},
  champRecherche: {borderWidth: 1, borderColor: '#D1E8F0',
    borderRadius: 10, padding: 12, fontSize: 14,
    backgroundColor: '#F7FAFC', color: '#1A1A2E'},
  boutonFiltre: {borderWidth: 1, borderColor: '#0D7680',
    borderRadius: 10, padding: 10, alignItems: 'center'},
  boutonFiltreActif: {backgroundColor: '#0D7680'},
  texteFiltre: {color: '#0D7680', fontWeight: 'bold',
    fontSize: 13},
  texteFiltreActif: {color: '#FFFFFF'},
  sectionVilles: {paddingHorizontal: 15, paddingBottom: 10},
  titreSection: {fontSize: 15, fontWeight: 'bold',
    color: '#14295A', marginBottom: 10},
  boutonVille: {borderWidth: 1, borderColor: '#D1E8F0',
    borderRadius: 20, paddingHorizontal: 15,
    paddingVertical: 8, marginRight: 8,
    backgroundColor: '#F7FAFC'},
  boutonVilleActif: {backgroundColor: '#0D7680',
    borderColor: '#0D7680'},
  texteVille: {fontSize: 13, color: '#14295A',
    fontWeight: '500'},
  texteVilleActif: {color: '#FFFFFF', fontWeight: 'bold'},
  statsVille: {marginHorizontal: 15, marginBottom: 10,
    padding: 10, backgroundColor: '#F0FDF4',
    borderRadius: 8},
  texteStats: {fontSize: 12, color: '#16A34A',
    fontWeight: 'bold'},
  section: {padding: 15},
  carteCentre: {backgroundColor: '#F7FAFC',
    borderRadius: 12, padding: 15, marginBottom: 15,
    borderWidth: 1, borderColor: '#E8F4F8',
    elevation: 2, shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1, shadowRadius: 4},
  enteteCentre: {flexDirection: 'row',
    alignItems: 'flex-start', marginBottom: 10},
  emojicCentre: {fontSize: 28, marginRight: 10},
  infoCentre: {flex: 1},
  nomCentre: {fontSize: 14, fontWeight: 'bold',
    color: '#14295A', marginBottom: 3},
  typeCentre: {fontSize: 12, color: '#0D7680',
    fontStyle: 'italic'},
  ligneBadges: {flexDirection: 'row', gap: 8,
    marginBottom: 10},
  badgeNutrition: {backgroundColor: '#D1FAE5',
    borderRadius: 8, paddingHorizontal: 8,
    paddingVertical: 4},
  badgeUrgence: {backgroundColor: '#FEE2E2',
    borderRadius: 8, paddingHorizontal: 8,
    paddingVertical: 4},
  texteBadge: {fontSize: 11, fontWeight: 'bold',
    color: '#1A1A2E'},
  ligneInfo: {flexDirection: 'row',
    alignItems: 'flex-start', marginBottom: 6},
  iconeInfo: {fontSize: 14, marginRight: 8, marginTop: 1},
  texteInfo: {fontSize: 13, color: '#1A1A2E', flex: 1},
  telephone: {color: '#0D7680', fontWeight: 'bold'},
  ligneServices: {marginTop: 8, padding: 8,
    backgroundColor: '#FFFFFF', borderRadius: 8,
    borderWidth: 1, borderColor: '#E8F4F8'},
  titreServices: {fontSize: 11, fontWeight: 'bold',
    color: '#64748B', marginBottom: 3},
  texteServices: {fontSize: 12, color: '#1A1A2E',
    lineHeight: 18},
  videConteneur: {alignItems: 'center', padding: 40},
  texteVide: {fontSize: 15, color: '#64748B'},
  noteImportante: {margin: 15, padding: 15,
    backgroundColor: '#FFF1F2', borderRadius: 12,
    borderLeftWidth: 4, borderLeftColor: '#DC2626'},
  titreNote: {fontSize: 14, fontWeight: 'bold',
    color: '#DC2626', marginBottom: 8},
  texteNote: {fontSize: 13, color: '#1A1A2E',
    lineHeight: 22},
});

export default EcranCentresSante;