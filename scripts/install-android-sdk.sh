#!/bin/bash
set -e

echo "📦 Installation Android SDK..."

# Dossier cible
SDK_DIR="$HOME/Library/Android/sdk"
TOOLS_DIR="$SDK_DIR/cmdline-tools/latest"

mkdir -p "$TOOLS_DIR"

# Télécharger command line tools
echo "⬇️  Téléchargement cmdline-tools..."
curl -L -o /tmp/cmdline-tools.zip \
  "https://dl.google.com/android/repository/commandlinetools-mac-11076708_latest.zip"

echo "📂 Extraction..."
unzip -q /tmp/cmdline-tools.zip -d /tmp/ct

# Déplacer au bon endroit
rm -rf "$TOOLS_DIR"
mv /tmp/ct/cmdline-tools "$TOOLS_DIR"
rm -rf /tmp/ct /tmp/cmdline-tools.zip

echo "🔧 Variables d'environnement..."
{
  echo 'export ANDROID_HOME=$HOME/Library/Android/sdk'
  echo 'export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk'
  echo 'export PATH=$PATH:$HOME/Library/Android/sdk/cmdline-tools/latest/bin'
  echo 'export PATH=$PATH:$HOME/Library/Android/sdk/platform-tools'
} >> ~/.zshrc

export ANDROID_HOME="$SDK_DIR"
export PATH="$PATH:$TOOLS_DIR/bin"

echo "✅ Acceptation des licences..."
yes | "$TOOLS_DIR/bin/sdkmanager" --licenses 2>/dev/null || true

echo "📱 Installation SDK Android 35..."
"$TOOLS_DIR/bin/sdkmanager" "platform-tools" "build-tools;35.0.0" "platforms;android-35"

echo ""
echo "✅ Android SDK installé dans : $SDK_DIR"
echo "👉 Relance le terminal ou tape : source ~/.zshrc"
