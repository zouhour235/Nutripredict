import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.optimizers import Adam
import pickle

# ============================================================
# CONFIGURATION — 4 CLASSES CARENCES
# ============================================================

DOSSIER_TRAIN = "data/images/carences/train"
DOSSIER_TEST = "data/images/carences/test"
TAILLE_IMAGE = (224, 224)
BATCH_SIZE = 32
EPOCHS_PHASE1 = 15
EPOCHS_PHASE2 = 25
NB_CLASSES = 4

print("=" * 60)
print("CNN NUTRI PREDICT — 4 CLASSES DE CARENCES")
print("=" * 60)
print(f"✅ Classes : {os.listdir(DOSSIER_TRAIN)}")

# ============================================================
# PRÉPARATION DES DONNÉES
# ============================================================

print("\n📊 Préparation des données...")

generateur_train = ImageDataGenerator(
    rescale=1./255,
    rotation_range=40,
    width_shift_range=0.3,
    height_shift_range=0.3,
    horizontal_flip=True,
    zoom_range=0.3,
    shear_range=0.2,
    brightness_range=[0.7, 1.3],
    channel_shift_range=20,
    fill_mode='nearest',
    validation_split=0.2
)

generateur_test = ImageDataGenerator(rescale=1./255)

donnees_train = generateur_train.flow_from_directory(
    DOSSIER_TRAIN,
    target_size=TAILLE_IMAGE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    shuffle=True
)

donnees_validation = generateur_train.flow_from_directory(
    DOSSIER_TRAIN,
    target_size=TAILLE_IMAGE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation'
)

donnees_test = generateur_test.flow_from_directory(
    DOSSIER_TEST,
    target_size=TAILLE_IMAGE,
    batch_size=BATCH_SIZE,
    class_mode='categorical'
)

print(f"✅ Entraînement : {donnees_train.samples} images")
print(f"✅ Validation   : {donnees_validation.samples} images")
print(f"✅ Test         : {donnees_test.samples} images")

# Sauvegarde des classes
with open("models/classes_cnn.pkl", "wb") as f:
    pickle.dump(donnees_train.class_indices, f)
print(f"✅ Classes : {donnees_train.class_indices}")

# ============================================================
# CONSTRUCTION DU MODÈLE
# ============================================================

print("\n🧠 Construction du modèle MobileNetV2...")

modele_base = MobileNetV2(
    weights='imagenet',
    include_top=False,
    input_shape=(224, 224, 3)
)
modele_base.trainable = False

x = modele_base.output
x = GlobalAveragePooling2D()(x)
x = BatchNormalization()(x)
x = Dense(512, activation='relu')(x)
x = Dropout(0.5)(x)
x = BatchNormalization()(x)
x = Dense(256, activation='relu')(x)
x = Dropout(0.3)(x)
x = Dense(128, activation='relu')(x)
x = Dropout(0.2)(x)
predictions = Dense(NB_CLASSES, activation='softmax')(x)

modele_cnn = Model(
    inputs=modele_base.input,
    outputs=predictions
)

modele_cnn.compile(
    optimizer=Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

print(f"✅ Modèle construit — {modele_cnn.count_params():,} paramètres")

# ============================================================
# PHASE 1 — Couches de classification seulement
# ============================================================

print("\n🔥 PHASE 1 — Entraînement couches classification...")

callbacks1 = [
    tf.keras.callbacks.EarlyStopping(
        patience=5,
        restore_best_weights=True,
        monitor='val_accuracy',
        verbose=1
    ),
    tf.keras.callbacks.ModelCheckpoint(
        'models/modele_cnn_best.h5',
        save_best_only=True,
        monitor='val_accuracy',
        verbose=1
    ),
    tf.keras.callbacks.ReduceLROnPlateau(
        factor=0.5,
        patience=3,
        monitor='val_loss',
        verbose=1
    ),
]

h1 = modele_cnn.fit(
    donnees_train,
    validation_data=donnees_validation,
    epochs=EPOCHS_PHASE1,
    callbacks=callbacks1,
    verbose=1
)

best_acc_phase1 = max(h1.history['val_accuracy']) * 100
print(f"\n✅ Phase 1 — Meilleure val_accuracy : {best_acc_phase1:.2f}%")

# ============================================================
# PHASE 2 — Fine-tuning des dernières couches
# ============================================================

print("\n🔥 PHASE 2 — Fine-tuning...")

modele_base.trainable = True
for layer in modele_base.layers[:-30]:
    layer.trainable = False

modele_cnn.compile(
    optimizer=Adam(learning_rate=0.00001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

callbacks2 = [
    tf.keras.callbacks.EarlyStopping(
        patience=7,
        restore_best_weights=True,
        monitor='val_accuracy',
        verbose=1
    ),
    tf.keras.callbacks.ModelCheckpoint(
        'models/modele_cnn_best.h5',
        save_best_only=True,
        monitor='val_accuracy',
        verbose=1
    ),
    tf.keras.callbacks.ReduceLROnPlateau(
        factor=0.3,
        patience=3,
        monitor='val_loss',
        min_lr=0.0000001,
        verbose=1
    ),
]

h2 = modele_cnn.fit(
    donnees_train,
    validation_data=donnees_validation,
    epochs=EPOCHS_PHASE2,
    callbacks=callbacks2,
    verbose=1
)

best_acc_phase2 = max(h2.history['val_accuracy']) * 100
print(f"\n✅ Phase 2 — Meilleure val_accuracy : {best_acc_phase2:.2f}%")

# ============================================================
# ÉVALUATION FINALE
# ============================================================

print("\n📊 Évaluation finale...")
resultats = modele_cnn.evaluate(donnees_test, verbose=1)
exactitude_finale = resultats[1] * 100

print(f"\n{'='*60}")
print(f"🎯 EXACTITUDE FINALE : {exactitude_finale:.2f}%")
print(f"{'='*60}")

# ============================================================
# SAUVEGARDE FINALE
# ============================================================

modele_cnn.save("models/modele_cnn.h5")
print("\n✅ Modèle CNN final sauvegardé !")
print("\n" + "=" * 60)
print("✅ ENTRAÎNEMENT CNN TERMINÉ AVEC SUCCÈS !")
print("=" * 60)