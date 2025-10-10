#!/bin/sh
# Maven Wrapper script

set -e

MAVEN_PROJECTBASEDIR=${MAVEN_BASEDIR:-"$PWD"}
MAVEN_OPTS="$MAVEN_OPTS -Xmx512m"

if [ -z "$MAVEN_SKIP_RC" ] ; then
  if [ -f /etc/mavenrc ] ; then
    . /etc/mavenrc
  fi
  if [ -f "$HOME/.mavenrc" ] ; then
    . "$HOME/.mavenrc"
  fi
fi

MAVEN_PROJECTBASEDIR=${MAVEN_BASEDIR:-"$PWD"}
WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

exec "$JAVACMD" \
  $MAVEN_OPTS \
  -classpath "$MAVEN_PROJECTBASEDIR/.mvn/wrapper/maven-wrapper.jar" \
  "-Dmaven.home=${M2_HOME}" \
  "-Dmaven.multiModuleProjectDirectory=${MAVEN_PROJECTBASEDIR}" \
  ${WRAPPER_LAUNCHER} "$@"