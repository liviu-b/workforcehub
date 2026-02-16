pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Se descarcă codul de pe GitHub...'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    // Această comandă spune Docker Desktop-ului tău să facă imaginea
                    sh 'docker build -t proiectul-meu-imagine:latest .'
                }
            }
        }

        stage('Test') {
            steps {
                echo 'Aici poți rula teste în interiorul containerului...'
            }
        }
    }
}