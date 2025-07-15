//dog cause deep inside all this shit does is basicly fetch i will try to implement without using direct Promise and no copilot/ai help, I will add a bark method too, just for fun
export class Dog {
    private constructor(baseUrl: string, interceptors: Interceptors) {
        this.baseUrl = baseUrl;
        this.interceptors = interceptors
    }

    private baseUrl: string;
    private interceptors: Interceptors;

    public static create({baseUrl, interceptors}: {
        baseUrl: string,
        interceptors?: {request?: (req: MyRequest) => MyRequest, response?: (req: MyResponse<any>) => MyResponse<any>}
    }): Dog {
        const aux = new Interceptors({req: interceptors?.request, res: interceptors?.response})
        return new Dog(baseUrl, aux)
    }

    private buildUri(uri: string, parameters?: Record<string, string | string[]>): string {
        if (parameters && Object.entries(parameters).length > 0) {
            let result = "?"
            const params = Object.entries(parameters)
            for(let i = 0; i < params.length; i++){
                result += params[i][1] instanceof Array
                    ? `${params[i][0]}=${(params[i][1] as Array<string>).join(",")}`
                    :  `${params[i][0]}=${params[i][1]}`

                if (i != (params.length -1)){
                    result += '&'
                }
            }
            return this.baseUrl + uri + result;
        }
        return this.baseUrl + uri;
    }

    private fetch<T = any>(method: Method, uri: string, {options, body}: {options?: Options, body?: any}) {
        const request = this.interceptors.interceptRequest({
                uri: this.buildUri(uri, options?.params),
                body: body ?? undefined,
                headers: options?.headers ? options.headers : {}
            }
        )
        return DogRequest.makeRequest<T>(method, request, this.interceptors.interceptResponse)
    }
    
    get<T = any>(uri: string, options?: Options): DogRequest<T> {
        return this.fetch(Method.GET, uri, {options})
    }

    post<T = any>(uri: string, body: any, options?: Options): DogRequest<T> {
        return this.fetch(Method.POST, uri, {body, options})
    }

    put<T = any>(uri: string, body: any, options?: Options): DogRequest<T> {
        return this.fetch(Method.PUT, uri, {body, options})
    }

    delete<T = any>(uri: string, options?: Options): DogRequest<T> {
        return this.fetch(Method.DELETE, uri, {options})
    }

    bark() {
        console.log("Woof!")
    }
}

class Interceptors {
    constructor({req, res}: {req?:(req: MyRequest) => MyRequest, res?: (res: MyResponse<any>) => MyResponse<any>}) {
        this.interceptRequest = req ? req : (req)=>req;
        this.interceptResponse = res ? res : (res)=>res;
    }
    interceptRequest: (req: MyRequest) => MyRequest
    interceptResponse: (res: MyResponse<any>) => MyResponse<any>

}

enum Method {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE'
}

class DogRequest<T = any> {
    constructor(method: Method, request: MyRequest, responseInterceptor: (res: MyResponse<any>) => MyResponse<any>) {
        this.method = method;
        this.request = request;
        this.responseInterceptor = responseInterceptor;
    }

    private thenCallback: (response: MyResponse<T>) => void = () => {}
    private errorCallback: (error: FetchError) => void = () => {}
    private responseInterceptor: (res: MyResponse<any>) => MyResponse<any>
    private method: Method
    private request: MyRequest

    then(callback: (response: MyResponse<T>)=> void) {
        this.thenCallback = callback;
        return this;
    };

    error(callback: (error: FetchError) => void) {
        this.errorCallback = callback;
        return this;
    }

    call(): void {
        try{
            fetch(this.request.uri, {
                method: this.method,
                headers: this.request.headers,
                body: this.request.body ? JSON.stringify(this.request.body) : undefined
            })
            .then(async (res)=>{
                if(res.status >= 400){
                    const err = new FetchError(res.status, await streamParse(res.body))
                    this.errorCallback(err);
                    return;
                }           
                res.json().then(res => this.thenCallback(this.responseInterceptor({data: res})))
            })
        } catch (err) {
            err = new FetchError(400, err)
            this.errorCallback(err)
        }
    }

    public static makeRequest<T = any>(method: Method, req: MyRequest, responseInterceptor): DogRequest<T> {
        return new DogRequest(method, req, responseInterceptor)
    }
}

class FetchError {
    constructor(status: number, error: string) {
        this.status = status;
        this.error = this.buildError(error);
    }

    status: number;
    error: any;

    buildError(error: string){
        try{
            this.error = JSON.parse(error)
        } catch (err){
            this.error = error;
        }
    }
}

interface MyRequest {
    uri: string;
    body?: any;
    headers: Record<string,string>;
}

interface MyResponse<T> {
    data: T
}

interface Options {
    headers?: Record<string, string>
    params?: Record<string, string | string[]>
}

//fuck ai help T-T, it seems that theres no good way to do this whitout async
async function streamParse(stream: ReadableStream<Uint8Array> | null) {
    if(!stream){
        return "";
    }
    const reader = stream.getReader();

    let result = '';
    const decoder = new TextDecoder();

    while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    result += decoder.decode(value, { stream: true });
    }

    result += decoder.decode();
    return result
}

const dog = Dog.create({
    baseUrl: ''
})

export default dog