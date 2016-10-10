const Types = {
  String: 'string',
  Object: 'object'
}

export default {
  UI: {
    display(messages) {
      if(Types.String === typeof messages) console.log(messages)
      else console.log(messages.join('\n'))
    },
    displayErrors(errors) {
      if(Types.String === typeof errors) console.log(errors)
      else {
        const errorsMsg = Object.keys(errors).reduce((acc, field) => {
          const fieldErrors = errors[field]
          return acc.concat(fieldErrors)
        }, [])
        this.display(errorsMsg)
      }
    }
  }
}
