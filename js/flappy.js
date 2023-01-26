function novoElemento(tagName, className) {
    const elem = document.createElement(tagName);
    elem.className = className;
    return elem;
}

function Barreira(reversa = false) {
    this.elemento = novoElemento('div', 'barreira');

    const borda = novoElemento('div', 'borda');
    const corpo = novoElemento('div', 'corpo');
    this.elemento.appendChild(reversa ? corpo : borda); // add corpo ou borda
    this.elemento.appendChild(reversa ? borda : corpo); // add bora ou corpo
    
    this.setAltura = altura => corpo.style.height = `${altura}px`;
}

// const b = new Barreira(true);
// b.setAltura(200);
// document.querySelector('[wm-flappy]').appendChild(b.elemento);

function ParDeBarreiras(altura, abertura, x) {
    this.elemento = novoElemento('div', 'par-de-barreiras');

    this.superior = new Barreira(true);
    this.inferior = new Barreira(false);

    this.elemento.appendChild(this.superior.elemento);
    this.elemento.appendChild(this.inferior.elemento);

    this.sortearAbertura = () => {
        const alturaSuperior = Math.random() * (altura - abertura);
        const alturaInferior = altura - abertura - alturaSuperior;
        this.superior.setAltura(alturaSuperior);
        this.inferior.setAltura(alturaInferior);
    }

    this.getX = () => parseInt(this.elemento.style.left.split('px')[0]); // pega o x
    this.setX = x => this.elemento.style.left = `${x}px`; // altera a posição do x com base no getX
    this.getLargura = () => this.elemento.clientWidth;

    this.sortearAbertura();
    this.setX(x);
}

// const b = new ParDeBarreiras(700, 200, 800);
// document.querySelector('[wm-flappy]').appendChild(b.elemento);

function Barreiras(altura, largura, abertura, espaco, notificarPonto) { // altura e largura do jogo
    this.pares = [
        new ParDeBarreiras(altura, abertura, largura), // a largura começa fora da area do jogo (será o x)
        new ParDeBarreiras(altura, abertura, largura + espaco),
        new ParDeBarreiras(altura, abertura, largura + espaco * 2),
        new ParDeBarreiras(altura, abertura, largura + espaco * 3), // * 2 e * 3 significam que as barreiras serão criadas 2x e 3x + distantes da área externa do jogo. Para virem pra dentro como um "trenzinho"
    ];

    const deslocamento = 3 // velocidade de deslocamento dos pixels
    this.animar = () => {
        this.pares.forEach(par => {
            par.setX(par.getX() - deslocamento) // faz o movimento de deslocamento acontecer

            // quando o elemento sair da área do jogo
            if(par.getX() < -par.getLargura()) { // quando o valor de o x left for menor que o valor negativo da largura da barreira (ex.: se a barreira for 100 e estiver em -101)
                par.setX(par.getX() + espaco * this.pares.length);
                par.sortearAbertura(); // sorteia randomicamente as alturas das barreiras
            }

            const meio = largura / 2;
            const cruzouOMeio = par.getX() + deslocamento >= meio
                && par.getX() < meio; // se o valor par.getX() for >= ao meio e // menor que o meio. Ou seja: quando a barreira cruzar o meio
            if(cruzouOMeio) notificarPonto();
        })
    }
}

function Passaro(alturaJogo) {
    let voando = false;

    this.elemento = novoElemento('img', 'passaro');
    this.elemento.src = 'imgs/passaro.png';

    this.getY = () => parseInt(this.elemento.style.bottom.split('px')[0]); // para saber a posição do pássaro voando
    this.setY = y => this.elemento.style.bottom = `${y}px`;

    window.onkeydown = e => voando = true;
    window.onkeyup = e => voando = false;

    this.animar = () => {
        const novoY = this.getY() + (voando ? 8 : -5); // se tiver voando (true) aumenta 8 em Y
        const alturaMaxima = alturaJogo - this.elemento.clientHeight; // altura máxima será a altura da área - altura do pássaro

        if(novoY <= 0) {
            this.setY(0) // limite do chão
        } else if (novoY >= alturaMaxima) {
            this.setY(alturaMaxima) // limite do teto
        } else {
            this.setY(novoY) // demais é permitido
        }
    }

    this.setY(alturaJogo / 2); // posição inicial do pássaro
}



function Progresso() {
    this.elemento = novoElemento('span', 'progresso');
    this.atualizarPontos = pontos => {
        this.elemento.innerHTML = pontos;
    }
    this.atualizarPontos(0);
}

// const barreiras = new Barreiras(700, 1200, 200, 400);
// const passaro = new Passaro(700);
// const areaDoJogo = document.querySelector('[wm-flappy]'); // determina a area do jogo (a div)
// areaDoJogo.appendChild(passaro.elemento);
// areaDoJogo.appendChild(new Progresso().elemento);
// barreiras.pares.forEach(par => areaDoJogo.appendChild(par.elemento)); // adiciona os filhos da div (as barreiras)

// setInterval(() => {
//     barreiras.animar()
//     passaro.animar()
// }, 20);

function estaoSobrepostos(elementoA, elementoB) {
    const a = elementoA.getBoundingClientRect();
    const b = elementoB.getBoundingClientRect();

    const horizontal = a.left + a.width >= b.left // quando a area esquerda de A + sua largura é maior ou igual a area esquerda de B
        && b.left + b.width >= a.left; // vice-versa
    const vertical = a.top + a.height >= b.top // o extremo top de A é >= o topo de B
        && b.top + b.height >= a.top; // vice-versa
    return horizontal && vertical;
}

function colidiu(passaro, barreiras) {
    let colidiu = false;
    barreiras.pares.forEach(ParDeBarreiras => {
        if(!colidiu) {
            const superior = ParDeBarreiras.superior.elemento;
            const inferior = ParDeBarreiras.inferior.elemento;
            colidiu = estaoSobrepostos(passaro.elemento, superior)
                || estaoSobrepostos(passaro.elemento, inferior);
        }
    })
    return colidiu;
}

function FlappyBird() {
    let pontos = 0;

    const areaDoJogo = document.querySelector('[wm-flappy]');
    const altura = areaDoJogo.clientHeight;
    const largura = areaDoJogo.clientWidth;

    const progresso = new Progresso();
    const barreiras = new Barreiras(altura, largura, 200, 400,
        () => progresso.atualizarPontos(++pontos)); // incrementando a pontuação
    const passaro = new Passaro(altura);

    areaDoJogo.appendChild(progresso.elemento); // atualizando os pontos na tela
    areaDoJogo.appendChild(passaro.elemento); // coloca o pássaro na tela
    barreiras.pares.forEach(par => areaDoJogo.appendChild(par.elemento));

    this.start = () => {
        // loop do jogo
        const temporizador = setInterval(() => {
            barreiras.animar();
            passaro.animar();

            if(colidiu(passaro, barreiras)) {
                clearInterval(temporizador);
            }
        }, 20);
    }
}

new FlappyBird().start()