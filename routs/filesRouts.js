#!/usr/bin/env node

'use strict'

/* MODULE IMPORTS */
const Router = require('koa-router')
const koaBody = require('koa-body')({
	multipart: true,
	uploadDir: '.'
})

/* IMPORT CUSTOM MODULES */
const Download = require('../modules/filesDownload')
const Upload = require('../modules/filesUpload')

const router = new Router()
const dbName = 'website.db'

/**
 * The user download list page.
 *
 * @name MyDownloads Page
 * @route {GET} /myDownloads
 */
router.get('/myDownloads/', async ctx => {
	try {
		if (ctx.session.authorised === null) {
			ctx.redirect('/?msg=page only available when logged in')
		}else{
			await ctx.render('myDownloads', {
				user: ctx.session.user
			})
		}
	} catch (err) {
		await ctx.render('error', {
			message: err.message
		})
	}
})

/**
 * The website's home/upload page .
 *
 * @name Home Page
 * @route {GET} /
 */
router.get('/', async ctx => {
	console.log(ctx.session.user)
	await ctx.render('homepage', {user: ctx.session.user})
})

/**
 * The website's home/upload page after upload is done.
 *
 * @name Home Page
 * @route {POST} /
 */
// eslint-disable-next-line max-lines-per-function
router.post('/upload', koaBody, async ctx => {
	try {
		const upload = await new Upload(dbName)
		const body = ctx.request.body
		const file = ctx.request.files.file
		const isEmailInput = /\S+@\S+\.\S+/
		await upload.getSenderEmailWithUsername(ctx.session.user)
		if (isEmailInput.test(ctx.request.body.emailOrUsername)) {
			await upload.uploadFiles(file.path, file.type, file.name)
			await upload.sendFileWithReceiverEmail(body.emailOrUsername)
		}else {
			await upload.uploadFiles(file.path, file.type, file.name)
			await upload.sendFileWithReceiverUsername(body.emailOrUsername)
		}
		ctx.redirect(`/?msg=new user "${file.name}" uploaded`)
		upload.db.close()
	} catch (err) {
		console.log(err)
		await ctx.render('error', {
			message: err.message
		})
	}
})

/**b
 * The single download page.
 *
 * @name FileDownload Page
 * @route {GET} /downloadFile
 */
// eslint-disable-next-line max-lines-per-function
router.get('/downloadFile/:encryptedFileName', async ctx => {
	const fileSender = new Download(dbName)
	const downloadID = await fileSender.getDownloadId(ctx.params.encryptedFileName)
	const download = await fileSender.download(downloadID.downloadId)
	const downloadName = await fileSender.getName(downloadID.downloadId)
	if (ctx.session.authorised === true) {
		await ctx.render('downloadFile', {
			filePath: download.filePath,
			fileName: downloadName.fileName,
			user: ctx.session.user
		})
	} else {
		await ctx.render('downloadFile', {
			filePath: download.filePath,
			fileName: downloadName.fileName
		})
	}
})

/**
 * The single download page.
 *
 * @name FileDownload Page
 * @route {POST} /downloadFile
 */
router.post('/downloadFile/:downloadId', async ctx => {
	try {
		const fileSender = new Download(dbName)
		await fileSender.deleteFile(ctx.params.downloadId)
		ctx.redirect('/?msg=File downloaded and deleted successfully!')
	} catch (err) {
		console.log(err)
	}
})

module.exports = router
