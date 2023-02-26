class UserTemp {
  number
  step
  moeda = undefined
  valor = undefined
  isFluxo = false

  constructor(number, step, isFluxo){
    this.number = number 
    this.step = step 
    this.isFluxo = isFluxo
  }
}

module.exports = UserTemp