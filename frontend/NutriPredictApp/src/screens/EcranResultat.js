import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';

const EcranResultat = ({route, navigation}) => {
  const {resultat} = route.params;

  const couleurGravite = () => {
    switch (resultat.niveau_gravite) {
      case 'Sévère': return '#DC2626';
      case 'Vérification médicale': return '#DC2626';
      case 'Modérée': return '#D97706';
      case 'Légère': return '#16A34A';
      default: return '#0D7680';
    }
  };

  const emojiDiagnostic = () => {
    if (resultat.diagnostic === 'Normal') return '✅';
    if (resultat.diagnostic.includes('fer')) return '🩸';
    if (resultat.diagnostic.includes('vitamine A')) return '👁️';
    if (resultat.diagnostic.includes('calcium')) return '🦴';
    return '⚕️';
  };

  const couleurStatut = (statut) => {
    switch (statut) {
      case 'carence': return '#DC2626';
      case 'excès': return '#D97706';
      case 'normal': return '#16A34A';
      default: return '#64748B';
    }
  };

  return (
    <ScrollView style={styles.conteneur}>

      {/* En-tête résultat */}
      <View style={[styles.entete,
        {backgroundColor: couleurGravite()}]}>
        <Text style={styles.emoji}>{emojiDiagnostic()}</Text>
        <Text style={styles.titreDiagnostic}>
          {resultat.diagnostic}
        </Text>
        <Text style={styles.probabilite}>
          Score du modèle : {resultat.probabilite}%
        </Text>
        <View style={styles.badgeGravite}>
          <Text style={styles.texteGravite}>
            Niveau : {resultat.niveau_gravite}
          </Text>
        </View>
        {resultat.base_sur && (
          <Text style={styles.baseSur}>
            📊 Basé sur : {resultat.base_sur}
          </Text>
        )}
      </View>

            {/* Alertes cas inattendus */}
      {resultat.cas_inattendus &&
        resultat.cas_inattendus.cas_detectes > 0 && (
        <View style={styles.sectionAlertes}>
          <Text style={styles.titreAlertes}>
            🚨 Alertes importantes
          </Text>
          {resultat.cas_inattendus.alertes.map(
            (alerte, index) => (
            <View key={index} style={styles.carteAlerte}>
              <Text style={styles.texteAlerte}>{alerte}</Text>
            </View>
          ))}
          {resultat.cas_inattendus.conseils_urgents.map(
            (conseil, index) => (
            <View key={index} style={styles.carteConseilUrgent}>
              <Text style={styles.texteConseilUrgent}>
                {conseil}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Analyse des nutriments */}
      {resultat.analyses_nutriments &&
        resultat.analyses_nutriments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.titreSection}>
            📊 Analyse par nutriment
          </Text>
          <Text style={styles.sousTitreSection}>
            D'après vos symptômes déclarés
          </Text>

          {resultat.analyses_nutriments.map((analyse, index) => (
            <View key={index} style={[styles.carteNutriment, {
              borderLeftColor: couleurStatut(analyse.statut),
            }]}>
              <View style={styles.ligneNutriment}>
                <Text style={styles.iconeStatut}>
                  {analyse.icone}
                </Text>
                <Text style={styles.nomNutriment}>
                  {analyse.nutriment}
                </Text>
                <Text style={[styles.statutNutriment, {
                  color: couleurStatut(analyse.statut),
                }]}>
                  {analyse.statut.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.messageAnalyse}>
                {analyse.message}
              </Text>

              {/* Afficher les chiffres seulement si disponibles */}
              {analyse.seuil_normal && analyse.seuil_normal !== '-' && (
                <Text style={styles.seuilNormal}>
                  📏 Seuil normal OMS : {analyse.seuil_normal}
                </Text>
              )}

              {/* Valeur réelle seulement si fournie */}
              {analyse.valeur && analyse.valeur !== 0 && (
                <Text style={styles.valeurReelle}>
                  🔬 Votre valeur : {analyse.valeur} {analyse.unite}
                </Text>
              )}

              {analyse.severite && analyse.severite !== 'Normale' && (
                <View style={[styles.badgeSeverite, {
                  backgroundColor: couleurStatut(analyse.statut),
                }]}>
                  <Text style={styles.texteBadgeSeverite}>
                    Sévérité : {analyse.severite}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Analyses biologiques si disponibles */}
      {resultat.analyses_biologiques &&
        resultat.analyses_biologiques.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.titreSection}>
            🔬 Analyses biologiques
          </Text>
          <Text style={styles.sousTitreSection}>
            Basé sur vos valeurs réelles d'examen
          </Text>

          {resultat.analyses_biologiques.map((analyse, index) => (
            <View key={index} style={[styles.carteNutriment, {
              borderLeftColor: couleurStatut(analyse.statut),
            }]}>
              <View style={styles.ligneNutriment}>
                <Text style={styles.iconeStatut}>
                  {analyse.icone}
                </Text>
                <Text style={styles.nomNutriment}>
                  {analyse.parametre}
                </Text>
                <Text style={[styles.statutNutriment, {
                  color: couleurStatut(analyse.statut),
                }]}>
                  {analyse.statut.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.valeurReelle}>
                🔬 Votre valeur : {analyse.valeur} {analyse.unite}
              </Text>
              <Text style={styles.seuilNormal}>
                📏 Valeur normale : {analyse.normal}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Aliments recommandés : affichés seulement si la liste n'est pas vide */}
      {resultat.recommandations?.aliments?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.titreSection}>
            🍽️ Aliments recommandés
          </Text>
          <Text style={styles.contexteTchad}>
            Aliments disponibles localement au Tchad 🇹🇩
          </Text>
          {resultat.recommandations.aliments.map(
            (aliment, index) => (
              <View key={index} style={styles.ligneAliment}>
                <Text style={styles.texteAliment}>{aliment}</Text>
              </View>
            )
          )}
        </View>
      )}

      {/* Conseils personnalisés */}
      <View style={styles.sectionConseils}>
        <Text style={styles.titreSection}>
          💡 Conseils personnalisés
        </Text>
        <Text style={styles.texteConseils}>
          {resultat.recommandations.conseils}
        </Text>
      </View>

      {/* Avertissement médical */}
      <View style={styles.avertissement}>
        <Text style={styles.texteAvertissement}>
          ⚠️ Ce diagnostic est une aide à la décision.
          Consultez un agent de santé ou un médecin
          pour une confirmation médicale.
        </Text>
      </View>

      {/* Boutons */}
      <View style={styles.boutons}>
        <TouchableOpacity
          style={styles.boutonPrimaire}
          onPress={() => navigation.navigate('Accueil')}>
          <Text style={styles.texteBoutonPrimaire}>
            🔍 Nouveau diagnostic
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.boutonSecondaire}
          onPress={() => navigation.goBack()}>
          <Text style={styles.texteBoutonSecondaire}>
            ← Retour
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
    padding: 30,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  titreDiagnostic: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  probabilite: {
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 10,
    opacity: 0.9,
  },
  badgeGravite: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 6,
    marginBottom: 8,
  },
  texteGravite: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  baseSur: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
    fontStyle: 'italic',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F4F8',
  },
  sectionConseils: {
    padding: 20,
    backgroundColor: '#F7FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F4F8',
  },
  titreSection: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#14295A',
    marginBottom: 5,
  },
  sousTitreSection: {
    fontSize: 12,
    color: '#0D7680',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  carteNutriment: {
    backgroundColor: '#F7FAFC',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 1,
  },
  ligneNutriment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconeStatut: {
    fontSize: 20,
    marginRight: 8,
  },
  nomNutriment: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#14295A',
    flex: 1,
  },
  statutNutriment: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageAnalyse: {
    fontSize: 13,
    color: '#1A1A2E',
    marginBottom: 5,
    lineHeight: 18,
  },
  seuilNormal: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 3,
  },
  valeurReelle: {
    fontSize: 13,
    color: '#14295A',
    fontWeight: 'bold',
    marginTop: 3,
  },
  badgeSeverite: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  texteBadgeSeverite: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  contexteTchad: {
    fontSize: 12,
    color: '#0D7680',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  ligneAliment: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F4F8',
  },
  texteAliment: {
    fontSize: 14,
    color: '#1A1A2E',
    lineHeight: 22,
  },
  texteConseils: {
    fontSize: 14,
    color: '#1A1A2E',
    lineHeight: 24,
    marginTop: 8,
  },
  avertissement: {
    margin: 20,
    padding: 15,
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#F0A500',
  },
  texteAvertissement: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 20,
  },
  boutons: {
    padding: 20,
    gap: 12,
  },
  boutonPrimaire: {
    backgroundColor: '#0D7680',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 3,
  },
  texteBoutonPrimaire: {
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
  },
  texteBoutonSecondaire: {
    color: '#0D7680',
    fontSize: 15,
    fontWeight: 'bold',
  },

    sectionAlertes: {
    padding: 20,
    backgroundColor: '#FFF1F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4E6',
  },
  titreAlertes: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 12,
  },
  carteAlerte: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  texteAlerte: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  carteConseilUrgent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  texteConseilUrgent: {
    fontSize: 13,
    color: '#1A1A2E',
    lineHeight: 20,
  },
});

export default EcranResultat;