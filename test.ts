import { Dog } from './my-axios'

const test = () => {
    const dog = Dog.create({
        baseUrl:'https://httpbin.org/',
        interceptors: {
            request: (req) => {
                req.headers.Authorization = "Bearer eyMyTokenXDD";
                return req;
            },
            response: (res) => {
                console.log("Response passing trhu filter")
                return res;
            }
        }
    })

    console.log("Before GET")
    dog.get('/get', {params: {"test": "true", "list": ['aaa', 'bbb', 'ccc']}, headers: {"api-key": "12345"}})
    .then((res)=>console.log(res))
    .error((err)=>console.log(err))
    .call();

    console.log("Before POST")
    dog.post('/post', {whatever: "some_value", otherField: 'OTHER_VALUE'}, {headers: {"Content-Type": "application/json"}})
    .then((res)=>console.log(res))
    .error((err)=>console.log(err))
    .call();

    console.log("Before PUT")
    dog.put('/put', {whatever: "some_value", otherField: 'OTHER_VALUE'}, {
        headers: {"Content-Type": "application/json"},
        params: {user: '1'}
    })
    .then((res)=>console.log(res))
    .error((err)=>console.log(err))
    .call();

    console.log("Before DELETE")
    dog.delete('/delete', {params: {"test": "true", "user": '1'}})
    .then((res)=>console.log(res))
    .error((err)=>console.log(err))
    .call();

    console.log("after all")
}

test()