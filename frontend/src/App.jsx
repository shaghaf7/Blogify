import { useState } from 'react';
import './App.css';
import { Route, Routes } from 'react-router-dom';

import Register from './components/Register';
import Login from './components/Login';
import Allblogs from './components/Allblogs';
import AddBlog from './components/Addblog';
import MyBlogs from './components/Myblogs';
import AIBlog from './components/AIblog';


function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<Register />} />
        <Route path='/login' element={<Login />} />
        <Route path='/allblogs' element={<Allblogs />} />
        <Route path='/addblog' element={<AddBlog/>}/>
        <Route path='/myblogs' element={<MyBlogs/>}/>
        <Route path='/aiblog' element={<AIBlog/>}/>

      </Routes>
    </>
  );
}

export default App;
