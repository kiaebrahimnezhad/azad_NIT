import { createContext, useContext, useState } from "react"
import Input from "../../components/Input"
import Button from "../../components/Button"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios";
import { publicContext } from "../../App";
import { useEffect } from "react";

// مشترک کننده خصوصی صفحه لاگین
const loginContext = createContext(null);

function Login(){
    // ------| States and Contexts
    const [isForgotPass, setIsForgotPass] = useState(false)

    const {userName} = useContext(publicContext);

    const {isUserLogin} = useContext(publicContext);
    const navigate = useNavigate();

    useEffect(
        () =>{
            if(localStorage.getItem('isUserLogin') === 'y'){
                navigate('../user/information');
            }
        } , []
    )

    // ------| Functions
    const forgotSetup = () => {
        setIsForgotPass(!isForgotPass)
    }
   
    return(
        <loginContext.Provider value={{isForgotPass, setIsForgotPass, forgotSetup}}> 
            <section className="grid grid-cols-12 p-10 md:p-20 lg:px-45 bg-[#F7F2EF] h-dvh">
                <div className="col-span-12 lg:col-span-6 bg-[#ffffff] rounded-4xl border-[#14B3ED] lg:rounded-l-none">
                {
                    isForgotPass ? <ForgotForm /> : <LoginForm />
                }
                </div>
                <div className="hidden lg:block lg:col-span-6 bg-[#50A6CD] py-18 px-13 rounded-4xl lg:rounded-r-none">
                    <Welcome />
                </div>
                
            </section>
        </loginContext.Provider>
        
    )
}





function Welcome(){
    const {isForgotPass, forgotSetup} = useContext(loginContext);
    return(
        <div className=" h-full text-center text-white relative">
            <div className="absolute top-0 w-full">
                <p className="text-4xl pt-5 font-bold ">خوش آمدید!!!</p>
            </div>
            <div className="absolute top-3/9 w-full ">
                <p className="text-md text-justify">بازگشت دوباره شما را خوش‌آمد می‌گوییم. بسیار مفتخریم که در سامانه Nit Course درخدمت شما و امر آموزش کشور هستیم. امیدواریم از آموزش خودتون لذت ببرید!!!🔥</p>  
            </div>
            <div className="absolute top-5/9 h-1/6 w-full text-center">
                <Link to='/signin'>
                    <div className="relative h-full">
                        <p className="absolute left-1/4 right-1/4 rounded-4xl text-sm bg-[#67B2D5] w-2/4 p-4 transition delay-200 hover:scale-110 hover:bg-blue-700">ثبت‌نام نکرده‌اید!؟<br /> حساب کاربری بسازید!</p>
                    </div>
                </Link>
            </div>
            <div className="absolute top-7/9 h-1/6 w-full text-center ">
                <p className="text-md underline underline-offset-10 transition delay-200 hover:text-[#5fffec] hover:scale-115 py-2" onClick={forgotSetup}>
                {
                    isForgotPass ? 'بازگشت به صفحه ورود' : 'آیا رمز عبور خود را فراموش کرده‌اید؟'
                }
                </p>
            </div>
        </div>
    )
}





// فرم ورود
function LoginForm(){
    // ------| عمومی، برای تیلویند
    let loginPageInputsClass = 'border-gray-500 bg-[#F7F2EF] rounded-2xl w-full my-3 py-3 px-5 md:py-4 lg:py-4 disabled:bg-[#c3c3c3] '
    let loginPageButtonClass = 'bg-[#50A6CD]  text-md transition delay-200 hover:scale-110 hover:bg-blue-700 rounded-2xl text-white font-bold py-3 disabled:bg-gray-500 disabled:hover:scale-100 '
    // ------| 



    // ------| States and Contexts
    const [userInf, setUserInf] = useState({
        'username': '',
        'password': ''
    })

    const {userName, setUserName, isUserLogin, setIsUserLogin, token, setToken, userType, setUserType} = useContext(publicContext);

    const [submitResult, setSubmitResult] = useState({
        'result': '',
        'success': false,
        'show': false
    });

    const {forgotSetup} = useContext(loginContext);

    const navigate = useNavigate();



    // ------| Evant Handelers and Functions
    const userInfHandler = (e) => {
        setUserInf((pervState) => ({...pervState, [e.target.name]: e.target.value}));
    }

    // Login function
    const submitHandler = () => {
        try {
            console.log(userInf);
            axios.post('http://localhost:4000/login', userInf).then(
                (response) => {
                    // useContext after login
                    console.log(response);

                    localStorage.setItem('userName', userInf.username); setUserName(userInf.username);
                    localStorage.setItem('isUserLogin', 'y'); setIsUserLogin(true);
                    localStorage.setItem('token', response.data.token); setToken(response.data.token);
                    localStorage.setItem('userType', response.data.userType); setUserType(response.data.token);
                    

                    console.log('iam in login page', userName, isUserLogin, token, userType);

                    setSubmitResult({
                        'result': response.data.message,
                        'show': true,
                        'success': true
                    })
                    setTimeout(
                        () => {
                            navigate('/user/course');
                        }, 1000
                    )

                }
            ).catch(
                (err) => {
                    // console.log(err)
                    setSubmitResult({
                        'result': err.response.data.message,
                        'show': true,
                        'success': false
                    })
                }
            )
        } catch(err){
            console.error(err);
        }
        
    }



    // ------| HTML
    return(
        <div className="grid grid-cols-12 h-full ">
            <div className="text-center p-8 lg:p-12 col-span-12">
                <p className="font-bold text-2xl lg:text-4xl">ورود</p>
            </div>
            <Input 
            name='username' type="text" lable="نام کاربری" pHolder='kiaebi_' 
            description='لطفا نام‌کاربری خود را انتخاب کنید.' id='1' onChange={userInfHandler}
            inpClass={loginPageInputsClass}
            divClass='col-span-12 mx-5 mb-5 md:mx-10 lg:mx-15 '
            />
            {/* رشته‌ها باید ورودی انتخابی باشد، نه آزاد */}
            <Input 
            name='password' type="password" lable="رمز عبور" pHolder='MnkNKKNkn^&^*#@'
            description='لطفا رمز عبور خود را انتخاب نمایید.' id='2' onChange={userInfHandler}
            inpClass={loginPageInputsClass}
            divClass='col-span-12  mx-5 mb-5 md:mx-10 lg:mx-15 '
            /> 

            <div className={`col-span-12 text-center font-bold  ${submitResult.success ? 'text-green-500 scale-125' : 'text-red-600'}`}>
                <p>{submitResult.show ? (submitResult.success ? 'موفقیت ✅🗝️🔓' : ('⛔')) : (null)}</p>
                <p>{submitResult.show ? (submitResult.result) : (null)}</p>
            </div>

            <div className="col-span-12 mx-5  md:mx-10 md:mb-10 lg:mx-15 ">
                <Button divClass={'relative h-full py-3 px-5'} butClass={'absolute left-1/3 right-1/3 top-0 ' + loginPageButtonClass} handler={submitHandler} disabled={(userInf.username == '') || (userInf.password == '')}>
                ‌ورود
                </Button>
            </div>
            
            <div className="lg:hidden col-span-12 pt-5 mx-5 md:mx-10 lg:mx-15 text-center">
                <p className='text-[#50A6CD] transition delay-200 hover:scale-110 hover:text-blue-700 text-md' onClick={forgotSetup} >رمز عبور خود را فراموش کرده‌اید؟</p>
            </div>
            
            <div className="lg:hidden col-span-12 mx-5 md:mx-10  text-center">
                <Link to='/signin'>
                    <p className="text-[#50A6CD]  hover:text-blue-700 text-md transition delay-200 hover:scale-110">ثبت‌نام نکرده‌اید!؟ حساب کاربری بسازید!</p>
                </Link>
            </div>
        </div>
    )
}





// فرم فراموشی رمز
function ForgotForm(){
    // ------| عمومی، برای تیلویند
    let loginPageInputsClass = 'border-gray-500 bg-[#F7F2EF] rounded-2xl w-full my-2.5 py-3 px-5 md:py-3  disabled:bg-[#c3c3c3] '

    let loginPageButtonClass = 'text-md transition delay-200 hover:scale-110 hover:bg-blue-700 rounded-2xl text-white font-bold py-2 bg-[#50A6CD] disabled:bg-gray-500 disabled:hover:scale-100'
    // ------|


    // استیت‌ها و کانتکست‌ها
    const [userInf, setUserInf] = useState({
        'mail': '',
        'otp': '',
        'newPassword': ''
    });

    const [emailStatus, setEmailStatus] = useState({
        'input': false,
        'button': false
    })

    const [otpStatus, setOtpStatus] = useState({
        'input': true,
        'button': true
    })

    const {forgotSetup} = useContext(loginContext);



    // توابع ایونت‌ها
    const userInfHandler = (e) => {
        setUserInf((pervState) => ({...pervState, [e.target.name]: e.target.value}));
    }

    const letEditEmail = () => {
        setOtpStatus({
            input: true,
            button: true
        })
        setEmailStatus({
            input: false,
            button: false
        })
    }
    
    // مرحله اول فراموشی رمز، تایید ایمیل برای دریافت کد
    const emailSubmitHandler = () => {
        const req = {
            'mail': userInf.mail,
        };

        axios.post('http://localhost:4000/login/forgot-password', req).then( // port az mehdi
            (resp) => {
                // useContext after login
                console.log(resp.data.message);

                // دکمه و ورودی ایمیل را غیر فعال کرده
                setEmailStatus({
                    'input': true,
                    'button': true
                });
            
                setOtpStatus({
                    'input': false,
                    'button': false
                })

            }
        ).catch(
            (err) => {
                // نمایش خطا بعدا درست کن
                console.log(err)
            }
        );        
    }
    
    // مرحله دوم فراموشی رمز، ارسال کد و تعویض رمز
    const otpSubmitHandler = () => {
        axios.post('http://localhost:4000/login/forgot-password-otp', userInf).then( // port az mehdi
            (resp) => {
                // useContext after login
                console.log(resp.data.message);                

            }
        ).catch(
            (err) => {
                // نمایش خطا بعدا درست کن
                console.log(err)
            }
        );        
    }



    // HTML
    return(
        <section className="grid grid-cols-12 h-full">
            {/* <div className="text-center col-span-12 border-1 h-0 mb-0">
                <p className="font-bold text-xl lg:text-2xl border-1">بازیابی اطلاعات</p>
            </div> */}

            <div className="col-span-12 mt-5">
                <Input 
                name='mail' type='email' lable='ایمیل' pHolder='kiaebi_' 
                description='لطفا ایمیل خود را وارد کنید' id='1' onChange={userInfHandler}
                inpClass={loginPageInputsClass}
                divClass='col-span-12 mx-5 mb-5 md:mx-10 lg:mx-15'
                disabled={emailStatus.input}
                />
                
                <Button divClass='mx-5 md:mx-10 relative  h-10' butClass={'w-1/3 absolute left-1/3 right-1/3 h-full' + loginPageButtonClass} disabled={(emailStatus.button) || (userInf.mail == '')} handler={emailSubmitHandler} >
                    تایید ایمیل
                </Button>
                {
                    emailStatus.input ? (
                        <p className="pt-3 text-md underline underline-offset-10 transition delay-200 hover:text-[#5fffec] hover:scale-105 text-center" onClick={letEditEmail}>
                            ویرایش ایمیل✏️ 
                        </p>
                    ) : null
                }
            </div>

            <div className='col-span-12 '>
                <Input
                    name='otp'
                    description='کد ارسال شده به ایمیل خود رو وارد کنید.'
                    id='2'
                    lable=''
                    pHolder='23453'
                    onChange={userInfHandler}
                    type='number'
                    divClass='mx-5 mb-5 md:mx-10 lg:mx-15'
                    inpClass={loginPageInputsClass}
                    disabled={otpStatus.input}
                />
                <Input
                name='newPassword'
                description='رمز عبور جدید خود را انتخاب کنید. توجه کنید که با قبلی یکی نباشد.'
                id='3'
                lable='رمز عبور جدید'
                pHolder='23453'
                onChange={userInfHandler}
                type='input'
                divClass='col-span-12 mx-5 mb-5 md:mx-10 lg:mx-15 '
                inpClass={loginPageInputsClass}
                disabled={otpStatus.input}
                />
                <Button divClass='mx-5 md:mx-10 relative' butClass={' w-1/5 absolute left-2/5 right-2/5' + loginPageButtonClass} disabled={(otpStatus.button) || ((userInf.otp == '') || (userInf.newPassword == ''))} handler={otpSubmitHandler}>
                    تایید
                </Button>
            </div>
            <div className="lg:hidden col-span-12 pt-5 mx-5 md:mx-10 lg:mx-15 text-center">
                <p className='text-[#50A6CD] transition delay-200 hover:scale-110 hover:text-blue-700 text-md' onClick={forgotSetup}> بازگشت به صفحه ورود </p>
            </div>
        </section>
    )
}

export default Login;