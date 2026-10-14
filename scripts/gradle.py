#!/usr/bin/env python3
"""Run pinned Gradle through the machine's existing proxy and verified CA trust."""
import os, pathlib, shutil, subprocess, sys
from urllib.parse import urlsplit
ROOT=pathlib.Path(__file__).resolve().parents[1]
TOOLS=ROOT/'.tools'
os.environ['GRADLE_USER_HOME']=str(TOOLS/'gradle-home')
os.environ['ANDROID_USER_HOME']=str(TOOLS/'android-user')
os.environ['ANDROID_HOME']=str(TOOLS/'android-sdk')
os.environ['JAVA_HOME']=str(TOOLS/'jdk-21.0.8')
os.environ['PATH']=str(TOOLS/'jdk-21.0.8/bin')+os.pathsep+os.environ['PATH']
(TOOLS/'java-user').mkdir(exist_ok=True)
props=['-Duser.home='+str(TOOLS/'java-user')]
for protocol in ['https','http']:
    proxy=os.getenv(protocol.upper()+'_PROXY') or os.getenv(protocol+'_proxy')
    if proxy:
        parsed=urlsplit(proxy)
        if parsed.username or parsed.password:
            raise RuntimeError('Authenticated proxy needs platform-supported Java configuration; never persist credentials.')
        props.extend(['-D'+protocol+'.proxyHost='+parsed.hostname,
                      '-D'+protocol+'.proxyPort='+str(parsed.port or 80)])
cert=os.getenv('CODEX_PROXY_CERT')
if cert and pathlib.Path(cert).is_file():
    java=pathlib.Path(shutil.which('java')).resolve().parents[1]
    trust=TOOLS/'java-truststore'
    if not trust.exists():
        shutil.copyfile(java/'lib/security/cacerts',trust)
        subprocess.run(['keytool','-importcert','-noprompt','-trustcacerts','-alias','iskra-platform-ca',
                        '-file',cert,'-keystore',str(trust),'-storepass','changeit'],check=True)
    props.extend(['-Djavax.net.ssl.trustStore='+str(trust),'-Djavax.net.ssl.trustStorePassword=changeit'])
result=subprocess.run([str(TOOLS/'gradle-8.13/bin/gradle'),*props,*sys.argv[1:]],cwd=ROOT)
sys.exit(result.returncode)
